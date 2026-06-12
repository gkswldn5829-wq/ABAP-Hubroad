sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "zcl33sdns/cl33sdproject0001/model/formatter"
], (Controller, Fragment, Filter, FilterOperator, MessageBox, formatter) => {
    "use strict";

    /**
     * 로컬 렌더링 검증용 mock 스위치.
     * 백엔드에 DashStep '2','4','5' 데이터가 아직 없으므로(스케줄 테이블 미입력),
     * true로 켜면 OData 대신 mock 데이터로 5개 상태 + '0' 폴백 + 예외 플래그 렌더링을 검증할 수 있다.
     * 검증 후 false로 두고 운영한다.
     */
    var USE_MOCK = false;

    var POLL_INTERVAL_MS = 30000;

    return Controller.extend("zcl33sdns.cl33sdproject0001.controller.cl3_3_sd_project_0001", {

        formatter: formatter,

        /* ─────────────────────────── 라이프사이클 ─────────────────────────── */

        onInit() {
            this._iPollTimer = null;

            var oUiModel = this.getOwnerComponent().getModel("ui");
            oUiModel.setData({
                busy: false,
                autoRefresh: false,
                deliveries: [],
                kpi: {
                    total: 0, s0: 0, s1: 0, s2: 0, s3: 0, s4: 0, s5: 0,
                    transit: 0, noVeh: 0, vhcIssue: 0, exception: 0, amount: 0
                },
                detail: { header: {}, items: [] }
            });

            // 배송일 기본값 없음(전체 기간) — 테스트 데이터의 Dlvdat가 미래 날짜라
            // '오늘~오늘' 기본 필터로는 항상 0건이 되므로, 기간은 사용자가 지정할 때만 필터한다.
            this._loadData();
        },

        onExit() {
            this._stopPolling();
            if (this._oDetailDialog) {
                this._oDetailDialog.destroy();
            }
        },

        /* ─────────────────────────── 이벤트 핸들러 ─────────────────────────── */

        onSearch() {
            this._loadData();
        },

        onRefresh() {
            this._loadData();
        },

        onAutoRefreshToggle(oEvent) {
            this._stopPolling();
            if (oEvent.getParameter("state")) {
                this._iPollTimer = setInterval(this._loadData.bind(this), POLL_INTERVAL_MS);
            }
        },

        /**
         * IconTabBar 탭 선택 → 서버 재조회 없이 클라이언트 필터 (핸드오프 3.4).
         * 이미 받은 셋에서 DashStep / 예외 플래그로 거른다.
         */
        onTabSelect(oEvent) {
            var sKey = oEvent.getParameter("key");
            var oBinding = this.byId("deliveryTable").getBinding("items");
            var aFilters = [];

            if (sKey === "exc") {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("NoVehicleFlg", FilterOperator.EQ, "X"),
                        new Filter("VhcIssueFlg", FilterOperator.EQ, "X")
                    ],
                    and: false
                }));
            } else if (sKey !== "all") {
                aFilters.push(new Filter("DashStep", FilterOperator.EQ, sKey));
            }
            oBinding.filter(aFilters);
        },

        /**
         * 행 클릭 → 상세 Dialog. 아이템은 lazy load:
         * 해당 건 1건만 $expand=to_Item으로 read (메인 리스트 $expand 금지 — 핸드오프 4.4).
         */
        onItemPress(oEvent) {
            var oRow = oEvent.getSource().getBindingContext("ui").getObject();
            var oUiModel = this.getOwnerComponent().getModel("ui");

            oUiModel.setProperty("/detail/header", oRow);
            oUiModel.setProperty("/detail/items", []);

            if (USE_MOCK) {
                oUiModel.setProperty("/detail/items", this._getMockItems(oRow.Dlvno));
                this._openDetailDialog();
                return;
            }

            oUiModel.setProperty("/busy", true);
            this.getOwnerComponent().getModel().read("/Delivery('" + oRow.Dlvno + "')", {
                urlParameters: { "$expand": "to_Item" },
                success: (oData) => {
                    oUiModel.setProperty("/busy", false);
                    oUiModel.setProperty("/detail/header", oData);
                    oUiModel.setProperty("/detail/items",
                        (oData.to_Item && oData.to_Item.results) ? oData.to_Item.results : []);
                    this._openDetailDialog();
                },
                error: (oError) => {
                    oUiModel.setProperty("/busy", false);
                    this._showODataError(oError);
                }
            });
        },

        onCloseDetail() {
            this._oDetailDialog.close();
        },

        /* ─────────────────────────── 데이터 로드 / 집계 ─────────────────────────── */

        _loadData() {
            var oUiModel = this.getOwnerComponent().getModel("ui");

            if (USE_MOCK) {
                var aMock = this._getMockDeliveries();
                oUiModel.setProperty("/deliveries", aMock);
                this._aggregate(aMock);
                return;
            }

            oUiModel.setProperty("/busy", true);
            this.getOwnerComponent().getModel().read("/Delivery", {
                filters: this._buildFilters(),
                success: (oData) => {
                    var aRows = oData.results || [];
                    oUiModel.setProperty("/busy", false);
                    oUiModel.setProperty("/deliveries", aRows);
                    this._aggregate(aRows);
                },
                error: (oError) => {
                    oUiModel.setProperty("/busy", false);
                    this._showODataError(oError);
                }
            });
        },

        /**
         * FilterBar 값 → OData $filter 조립 (핸드오프 3.4).
         * Dlvdat는 Edm.DateTime이며 ABAP DATS는 UTC 자정으로 직렬화되므로
         * 로컬 타임존 밀림을 막기 위해 UTC 자정 Date로 만들어 BT(inclusive) 필터한다.
         */
        _buildFilters() {
            var aFilters = [];

            var oDateRange = this.byId("dateRange");
            var oFrom = oDateRange.getDateValue();
            var oTo = oDateRange.getSecondDateValue() || oFrom;
            if (oFrom) {
                var oFromUtc = new Date(Date.UTC(oFrom.getFullYear(), oFrom.getMonth(), oFrom.getDate()));
                var oToUtc = new Date(Date.UTC(oTo.getFullYear(), oTo.getMonth(), oTo.getDate()));
                aFilters.push(new Filter("Dlvdat", FilterOperator.BT, oFromUtc, oToUtc));
            }

            var sPlant = this.byId("plantSelect").getSelectedKey();
            if (sPlant) {
                aFilters.push(new Filter("Plant", FilterOperator.EQ, sPlant));
            }

            var sKunnr = this.byId("kunnrInput").getValue().trim();
            if (sKunnr) {
                aFilters.push(new Filter("Kunnr", FilterOperator.EQ, sKunnr));
            }

            var sVhcno = this.byId("vhcnoInput").getValue().trim();
            if (sVhcno) {
                aFilters.push(new Filter("Vhcno", FilterOperator.EQ, sVhcno));
            }

            return aFilters;
        },

        /**
         * KPI 집계는 프론트엔드에서 수행 (핸드오프 3.2-3).
         * 조회된 셋 전체로 DashStep별 카운트 + Totpr 합계 → "ui" JSONModel.
         */
        _aggregate(aRows) {
            var oKpi = {
                total: aRows.length,
                s0: 0, s1: 0, s2: 0, s3: 0, s4: 0, s5: 0,
                transit: 0, noVeh: 0, vhcIssue: 0, exception: 0, amount: 0
            };

            aRows.forEach((oRow) => {
                var sKey = "s" + (oRow.DashStep || "0");
                if (oKpi[sKey] !== undefined) {
                    oKpi[sKey] += 1;
                } else {
                    oKpi.s0 += 1;
                }
                var bNoVeh = oRow.NoVehicleFlg === "X";
                var bIssue = oRow.VhcIssueFlg === "X";
                if (bNoVeh) {
                    oKpi.noVeh += 1;
                }
                if (bIssue) {
                    oKpi.vhcIssue += 1;
                }
                if (bNoVeh || bIssue) {
                    oKpi.exception += 1;
                }
                oKpi.amount += parseFloat(oRow.Totpr) || 0;
            });

            // KPI 카드 "배송중"은 출고완료(출발대기) + 배송중 합산, 서브라벨이 출발대기
            oKpi.transit = oKpi.s3 + oKpi.s4;

            this.getOwnerComponent().getModel("ui").setProperty("/kpi", oKpi);
        },

        /* ─────────────────────────── Dialog / 에러 / 폴링 ─────────────────────────── */

        _openDetailDialog() {
            if (this._oDetailDialog) {
                this._oDetailDialog.open();
                return;
            }
            if (this._bDialogLoading) {
                return; // 이전 로드가 진행 중이면 중복 생성(duplicate id) 방지
            }
            this._bDialogLoading = true;
            Fragment.load({
                id: this.getView().getId(),
                name: "zcl33sdns.cl33sdproject0001.view.DetailDialog",
                controller: this
            }).then((oDialog) => {
                this._bDialogLoading = false;
                this._oDetailDialog = oDialog;
                this.getView().addDependent(oDialog);
                oDialog.open();
            }).catch((oError) => {
                // Fragment 파싱/로드 실패는 기본적으로 조용히 죽으므로 반드시 표면화한다
                this._bDialogLoading = false;
                var oRegistered = Fragment.byId(this.getView().getId(), "detailDialog");
                if (oRegistered) {
                    oRegistered.destroy(); // 부분 생성된 잔해 정리 (재시도 시 duplicate id 방지)
                }
                MessageBox.error("상세 화면을 여는 중 오류가 발생했습니다.\n"
                    + (oError && oError.message ? oError.message : oError));
            });
        },

        _showODataError(oError) {
            var sMessage = "데이터 조회 중 오류가 발생했습니다.";
            try {
                var oBody = JSON.parse(oError.responseText);
                if (oBody.error && oBody.error.message && oBody.error.message.value) {
                    sMessage = oBody.error.message.value;
                }
            } catch (e) { /* 응답 본문이 JSON이 아니면 기본 메시지 사용 */ }
            MessageBox.error(sMessage);
        },

        _stopPolling() {
            if (this._iPollTimer) {
                clearInterval(this._iPollTimer);
                this._iPollTimer = null;
            }
        },

        /* ─────────────────────────── Mock 데이터 (USE_MOCK=true 전용) ─────────────────────────── */

        _getMockDeliveries() {
            var oToday = new Date();
            return [
                { Dlvno: "DOP4000001", Plant: "1000", Kunnr: "M-CUST001", Shipto: "메가마트 강남점", Adrnr: "서울특별시 강남구 테헤란로 101", Dlvdat: oToday, Reqdt: null, Totpr: "1250000", Curr: "KRW", Stats: "00", Pkqt: "", Vhcno: "", Vhcpl: "", Drvnm: "", Drvph: "", Dlvst: "", Schst: "", Schtm: null, Arrtm: null, DashStep: "1", NoVehicleFlg: "", VhcIssueFlg: "" },
                { Dlvno: "DOP4000002", Plant: "1000", Kunnr: "M-CUST002", Shipto: "메가마트 송파점", Adrnr: "서울특별시 송파구 올림픽로 240", Dlvdat: oToday, Reqdt: null, Totpr: "980000", Curr: "KRW", Stats: "00", Pkqt: "01", Vhcno: "", Vhcpl: "", Drvnm: "", Drvph: "", Dlvst: "", Schst: "", Schtm: null, Arrtm: null, DashStep: "1", NoVehicleFlg: "", VhcIssueFlg: "" },
                { Dlvno: "DOP4000003", Plant: "1000", Kunnr: "M-CUST003", Shipto: "프레시고 마포점", Adrnr: "서울특별시 마포구 월드컵로 50", Dlvdat: oToday, Reqdt: null, Totpr: "1730000", Curr: "KRW", Stats: "01", Pkqt: "", Vhcno: "", Vhcpl: "", Drvnm: "", Drvph: "", Dlvst: "", Schst: "", Schtm: null, Arrtm: null, DashStep: "2", NoVehicleFlg: "X", VhcIssueFlg: "" },
                { Dlvno: "DOP4000004", Plant: "2000", Kunnr: "M-CUST004", Shipto: "한솔푸드 파주센터", Adrnr: "경기도 파주시 문산읍 통일로 1325", Dlvdat: oToday, Reqdt: null, Totpr: "2120000", Curr: "KRW", Stats: "01", Pkqt: "", Vhcno: "VH2000002", Vhcpl: "경기 81바 7733", Drvnm: "김도현", Drvph: "010-2233-4455", Dlvst: "01", Schst: "", Schtm: null, Arrtm: null, DashStep: "2", NoVehicleFlg: "", VhcIssueFlg: "X" },
                { Dlvno: "DOP4000008", Plant: "1000", Kunnr: "M-CUST004", Shipto: "메가마트 방이점", Adrnr: "서울특별시 송파구 양재대로 1178", Dlvdat: oToday, Reqdt: null, Totpr: "2849000", Curr: "KRW", Stats: "02", Pkqt: "", Vhcno: "VH1000005", Vhcpl: "서울 23가 251", Drvnm: "정시우", Drvph: "010-7224-2584", Dlvst: "00", Schst: "10", Schtm: { ms: 0 }, Arrtm: { ms: 0 }, DashStep: "3", NoVehicleFlg: "", VhcIssueFlg: "" },
                { Dlvno: "DOP4000010", Plant: "1000", Kunnr: "M-CUST005", Shipto: "프레시고 용산점", Adrnr: "서울특별시 용산구 한강대로 100", Dlvdat: oToday, Reqdt: null, Totpr: "3410000", Curr: "KRW", Stats: "02", Pkqt: "", Vhcno: "VH1000001", Vhcpl: "서울 88너 1004", Drvnm: "박지호", Drvph: "010-9876-1111", Dlvst: "00", Schst: "20", Schtm: { ms: 28800000 }, Arrtm: { ms: 37800000 }, DashStep: "4", NoVehicleFlg: "", VhcIssueFlg: "" },
                { Dlvno: "DOP4000012", Plant: "2000", Kunnr: "M-CUST006", Shipto: "한솔푸드 일산점", Adrnr: "경기도 고양시 일산동구 중앙로 1200", Dlvdat: oToday, Reqdt: null, Totpr: "1980000", Curr: "KRW", Stats: "03", Pkqt: "", Vhcno: "VH2000001", Vhcpl: "경기 45다 8282", Drvnm: "이서준", Drvph: "010-5555-2424", Dlvst: "00", Schst: "30", Schtm: { ms: 50400000 }, Arrtm: { ms: 59400000 }, DashStep: "5", NoVehicleFlg: "", VhcIssueFlg: "" },
                { Dlvno: "DOP4000026", Plant: "1000", Kunnr: "M-CUST007", Shipto: "메가마트 오산점", Adrnr: "경기도 오산시 경기대로 274", Dlvdat: oToday, Reqdt: null, Totpr: "770000", Curr: "KRW", Stats: "02", Pkqt: "", Vhcno: "", Vhcpl: "", Drvnm: "", Drvph: "", Dlvst: "", Schst: "", Schtm: null, Arrtm: null, DashStep: "3", NoVehicleFlg: "", VhcIssueFlg: "" },
                { Dlvno: "DOP4000099", Plant: "1000", Kunnr: "M-CUST008", Shipto: "데이터이상 테스트", Adrnr: "-", Dlvdat: oToday, Reqdt: null, Totpr: "0", Curr: "KRW", Stats: "99", Pkqt: "", Vhcno: "", Vhcpl: "", Drvnm: "", Drvph: "", Dlvst: "", Schst: "", Schtm: null, Arrtm: null, DashStep: "0", NoVehicleFlg: "", VhcIssueFlg: "" }
            ];
        },

        _getMockItems(sDlvno) {
            return [
                { Dlvno: sDlvno, Posnr: "10", Matcode: "MK-FT-0001", Matnm: "낙곱새 밀키트", Dlvqt: "100", Unit: "EA", Pkqt: "01", Scode: "WH-FG-01", Brtwr: "2849000", Curr: "KRW", PkIce: "300", IceUnit: "EA" },
                { Dlvno: sDlvno, Posnr: "20", Matcode: "MK-FT-0002", Matnm: "부대찌개 밀키트", Dlvqt: "50", Unit: "EA", Pkqt: "02", Scode: "WH-FG-01", Brtwr: "1100000", Curr: "KRW", PkIce: "150", IceUnit: "EA" }
            ];
        }
    });
});

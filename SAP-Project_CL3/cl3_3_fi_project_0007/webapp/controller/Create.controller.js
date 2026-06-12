sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/SearchField",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/Text",
    "sap/m/Button",
    "zc3fiasset27/assetmanagement/model/formatter",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (
    Controller, JSONModel,
    Dialog, SearchField, MTable, MColumn, ColumnListItem, MText, MButton,
    formatter, MessageToast, MessageBox
) {
    "use strict";

    var ACTION_NS = "com.sap.gateway.srvd.zrap_cl3_fi_01_srv.v0001.";

    // 계정항목 탐색도움말 — 로컬 마스터 데이터
    var ACCOUNT_DATA = [
        { Saknr: "1100000001", AccountType: "자산", AccountName: "현금",           Description: "현금 및 현금성 자산" },
        { Saknr: "1100000002", AccountType: "자산", AccountName: "보통예금",         Description: "법인 은행 계좌 잔액" },
        { Saknr: "1100000003", AccountType: "자산", AccountName: "외상매출금",        Description: "SD 출고 후 미회수 매출채권" },
        { Saknr: "1100000004", AccountType: "자산", AccountName: "미수금",           Description: "영업 외 미회수 채권" },
        { Saknr: "1100000005", AccountType: "자산", AccountName: "선급관세",          Description: "수입 통관 전 선납 관세" },
        { Saknr: "1100000006", AccountType: "자산", AccountName: "매출채권",          Description: "외상매출금 포괄 집계 계정" },
        { Saknr: "1100000007", AccountType: "자산", AccountName: "단기대여금",         Description: "1년 이내 회수 대여금" },
        { Saknr: "1100000008", AccountType: "자산", AccountName: "선급금",           Description: "PO 선급 지급액" },
        { Saknr: "1100000009", AccountType: "자산", AccountName: "소모품",           Description: "사용 전 자산 처리 소모품" },
        { Saknr: "1100000010", AccountType: "자산", AccountName: "원재료",           Description: "가공 투입 전 재료 재고" },
        { Saknr: "1100000011", AccountType: "자산", AccountName: "제품",            Description: "자체 가공 완료 반제품 재고" },
        { Saknr: "1100000012", AccountType: "자산", AccountName: "완제품",           Description: "SD 출고 대기 완성 재고" },
        { Saknr: "1100000013", AccountType: "자산", AccountName: "GR/IR",           Description: "입고·인보이스 임시 정산" },
        { Saknr: "1100000014", AccountType: "자산", AccountName: "부가세대급금",       Description: "매입 부가세 환급 청구권" },
        { Saknr: "1100000015", AccountType: "자산", AccountName: "감가상각누계액",      Description: "유형자산 차감 평가 계정" },
        { Saknr: "1100000016", AccountType: "자산", AccountName: "대손충당금",         Description: "매출채권 회수불능 평가 계정" },
        { Saknr: "1100000017", AccountType: "자산", AccountName: "선급비용",          Description: "미래 비용을 선지급한 선급비용" },
        { Saknr: "1300000001", AccountType: "자산", AccountName: "토지",            Description: "감가상각 제외 비유동자산" },
        { Saknr: "1300000002", AccountType: "자산", AccountName: "건물",            Description: "정액법 내용연수 40년" },
        { Saknr: "1300000003", AccountType: "자산", AccountName: "기계장치",          Description: "냉장·가공설비 정률법" },
        { Saknr: "1300000004", AccountType: "자산", AccountName: "차량운반구",         Description: "배송차량 정률법" },
        { Saknr: "1300000005", AccountType: "자산", AccountName: "비품",            Description: "사무기기 정액법" },
        { Saknr: "2100000001", AccountType: "부채", AccountName: "외상매입금",         Description: "MM MIRO 인보이스 미지급" },
        { Saknr: "2100000002", AccountType: "부채", AccountName: "미지급금",          Description: "영업 외 미지급 비용" },
        { Saknr: "2100000003", AccountType: "부채", AccountName: "미지급비용",         Description: "결산 발생주의 조정" },
        { Saknr: "2100000004", AccountType: "부채", AccountName: "선수금",           Description: "고객 선수금 출고 시 대체" },
        { Saknr: "2100000005", AccountType: "부채", AccountName: "예수금",           Description: "원천세·4대보험 납부 대기" },
        { Saknr: "2100000006", AccountType: "부채", AccountName: "부가세",           Description: "부가세 신고 납부 의무" },
        { Saknr: "2100000007", AccountType: "부채", AccountName: "단기차입금",         Description: "1년 이내 만기 차입금" },
        { Saknr: "2100000008", AccountType: "부채", AccountName: "매입채권-조정",       Description: "GR/IR 수량·가격 차이 조정" },
        { Saknr: "2100000009", AccountType: "부채", AccountName: "미지급관세",         Description: "통관 확정 후 납부 대기 관세" },
        { Saknr: "2100000010", AccountType: "부채", AccountName: "부가세예수금",        Description: "매출 시 고객으로부터 수취한 부가가치세 예수금" },
        { Saknr: "2300000001", AccountType: "부채", AccountName: "장기차입금",         Description: "1년 초과 만기 차입금" },
        { Saknr: "2300000002", AccountType: "부채", AccountName: "퇴직급여충당부채",     Description: "확정급여형 DB 부채" },
        { Saknr: "3100000001", AccountType: "자본", AccountName: "자본금",           Description: "납입 자본금" },
        { Saknr: "3100000002", AccountType: "자본", AccountName: "자본잉여금",         Description: "주식발행초과금 등" },
        { Saknr: "3100000003", AccountType: "자본", AccountName: "이익잉여금",         Description: "전기이월 및 당기순이익" },
        { Saknr: "3100000004", AccountType: "자본", AccountName: "기타포괄손익누계액",   Description: "외화환산 미실현손익 OCI" },
        { Saknr: "4100000001", AccountType: "수익", AccountName: "매출",            Description: "매출" },
        { Saknr: "4100000002", AccountType: "수익", AccountName: "상품매출",          Description: "원물 식자재 유통 매출" },
        { Saknr: "4100000003", AccountType: "수익", AccountName: "매출에누리",         Description: "반품·할인 차감 계정" },
        { Saknr: "4100000004", AccountType: "수익", AccountName: "제품매출",          Description: "자체 가공 밀키트 매출" },
        { Saknr: "4100000005", AccountType: "수익", AccountName: "이자수익",          Description: "예금·대여금 이자" },
        { Saknr: "4100000006", AccountType: "수익", AccountName: "외환차익",          Description: "외화 결제 실현 환차익" },
        { Saknr: "4100000007", AccountType: "수익", AccountName: "외화환산이익",        Description: "결산 미실현 평가이익" },
        { Saknr: "5100000001", AccountType: "비용", AccountName: "상품매출원가",        Description: "SD PGI 출고 자동 전표" },
        { Saknr: "5100000002", AccountType: "비용", AccountName: "매출원가",          Description: "제품 생산·가공 원가" },
        { Saknr: "5100000003", AccountType: "비용", AccountName: "정상감모손실",        Description: "재고 감모·파손 손실" },
        { Saknr: "5100000004", AccountType: "비용", AccountName: "포장비",           Description: "밀키트 포장재·패키징" },
        { Saknr: "5100000005", AccountType: "비용", AccountName: "냉장냉동보관비",       Description: "콜드체인 창고 보관료" },
        { Saknr: "5100000006", AccountType: "비용", AccountName: "통관수수료",         Description: "수입 통관 대행 수수료" },
        { Saknr: "5200000001", AccountType: "비용", AccountName: "급여",            Description: "임직원 급여" },
        { Saknr: "5200000002", AccountType: "비용", AccountName: "복리후생비",         Description: "4대보험 사용자 부담분" },
        { Saknr: "5200000003", AccountType: "비용", AccountName: "여비교통비",         Description: "출장·교통 비용" },
        { Saknr: "5200000004", AccountType: "비용", AccountName: "수도광열비",         Description: "공장·창고 수도·전기·가스" },
        { Saknr: "5200000005", AccountType: "비용", AccountName: "차량유지비",         Description: "배송차량 연료·수리비" },
        { Saknr: "5200000006", AccountType: "비용", AccountName: "광고선전비",         Description: "마케팅·홍보 비용" },
        { Saknr: "5200000007", AccountType: "비용", AccountName: "운반비",           Description: "외부 물류·배송비" },
        { Saknr: "5200000008", AccountType: "비용", AccountName: "관세비",           Description: "수입 관세 확정 차액" },
        { Saknr: "5200000009", AccountType: "비용", AccountName: "감가상각비",         Description: "유형자산 정기 감가" },
        { Saknr: "5200000010", AccountType: "비용", AccountName: "퇴직급여",          Description: "확정급여형 DB 비용" },
        { Saknr: "5200000011", AccountType: "비용", AccountName: "보험료",           Description: "사용 전 자산 처리 보험료" },
        { Saknr: "5300000001", AccountType: "비용", AccountName: "이자비용",          Description: "차입금·사채 이자" },
        { Saknr: "5300000002", AccountType: "비용", AccountName: "외환차손",          Description: "외화 결제 실현 환차손" },
        { Saknr: "5300000003", AccountType: "비용", AccountName: "외화환산손실",        Description: "결산 미실현 평가손실" },
        { Saknr: "5300000004", AccountType: "비용", AccountName: "대손상각비",         Description: "매출채권 회수불능 비용" },
        { Saknr: "5300000005", AccountType: "비용", AccountName: "비정상감모손실",       Description: "통제 실패·설비고장 등 비정상 재고 손실" }
    ];

    // 폼 기본값 — 회사코드 8282, OData 필드명 1:1 매핑
    var DEFAULT_FORM = {
        Bukrs:   "8282",    // 회사코드 기본값
        Anlnr:   "",        // 자동 채번 (서버 결정)
        Anltx:   "",        // 자산명칭 *
        Anlkl:   "",        // 자산분류 *
        Saknr:   "",        // 자산 G/L 계정
        Afaknr:  "",        // 감가상각누계 계정
        Aufaknr: "",        // 감가상각비 계정
        Aktiv:   "",        // 취득일 (yyyy-MM-dd) *
        Anschw:  "",        // 취득가액 *
        Salvage: "",        // 잔존가치
        Ndjar:   "",        // 내용연수 *
        Afamid:  "",        // 상각방법 (00/01/02) *
        Werks:   "",        // 플랜트 *
        Kostl:   "",        // 코스트센터
        Prctr:   "",        // 손익센터
        Lifnr:   "",        // 매입처
        Status:  "1",       // 자산상태 (기본: 활성)
        Waers:   "KRW"      // 통화
    };

    // 탐색도움말 설정
    var VH_CONFIG = {
        Saknr:   { entity: "/AccountVH",    title: "계정항목 선택", key: "Saknr",  columns: [{label:"계정번호", path:"Saknr", width:"10rem"}, {label:"계정명", path:"AccountName"}, {label:"유형", path:"AccountType", width:"8rem"}] },
        Afaknr:  { entity: "/AccountVH",    title: "계정항목 선택", key: "Saknr",  columns: [{label:"계정번호", path:"Saknr", width:"10rem"}, {label:"계정명", path:"AccountName"}, {label:"유형", path:"AccountType", width:"8rem"}] },
        Aufaknr: { entity: "/AccountVH",    title: "계정항목 선택", key: "Saknr",  columns: [{label:"계정번호", path:"Saknr", width:"10rem"}, {label:"계정명", path:"AccountName"}, {label:"유형", path:"AccountType", width:"8rem"}] },
        Anlkl:   { entity: "/SectionVH",    title: "자산분류 선택", key: "Anlkl",  columns: [{label:"분류코드", path:"Anlkl", width:"10rem"}, {label:"분류명칭", path:"Description"}] },
        Status:  { entity: "/AssetStateVH", title: "자산상태 선택", key: "Status", columns: [{label:"상태코드", path:"Status", width:"10rem"}, {label:"상태명칭", path:"Description"}] },
        Afamid:  { entity: "/MethodVH",     title: "상각방법 선택", key: "Afamid", columns: [{label:"상각코드", path:"Afamid", width:"10rem"}, {label:"상각방법", path:"Description"}] },
        Kostl:   { entity: "/CostcenterVH",   title: "코스트센터 선택", key: "Kostl", columns: [{label:"코스트센터", path:"Kostl",  width:"10rem"}, {label:"명칭", path:"Description"}] },
        Werks:   { entity: "/PlantVH",        title: "플랜트 선택",   key: "Plant", columns: [{label:"플랜트", path:"Plant", width:"8rem"}, {label:"공장이름",   path:"Pname"}] },
        Prctr:   { entity: "/ProfitCenterVH", title: "손익센터 선택", key: "Prctr", columns: [{label:"손익센터", path:"Prctr", width:"10rem"},{label:"손익센터명", path:"Ktext"}] }
    };

    return Controller.extend("zc3fiasset27.assetmanagement.controller.Create", {

        formatter: formatter,

        onInit: function () {
            this.getView().setModel(new JSONModel(Object.assign({}, DEFAULT_FORM)), "form");
            this.getOwnerComponent().getRouter()
                .getRoute("RouteCreate")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var oArgs = oEvent.getParameter("arguments");
            var sAnlnr = oArgs.Anlnr;
            var oFormData = Object.assign({}, DEFAULT_FORM);
            
            if (sAnlnr && sAnlnr !== "new") {
                oFormData.Anlnr = sAnlnr;
            }
            
            this.getView().getModel("form").setData(oFormData);
        },

        // ══════════════════════════════════════════════
        // 공용 탐색도움말 (Value Help)
        // ══════════════════════════════════════════════

        onValueHelpRequest: function (oEvent) {
            var oSource = oEvent.getSource();
            var oBinding = oSource.getBinding("value");
            // 보다 확실한 필드명 추출 (form>/Kostl 등 대응)
            var sPath = oBinding ? oBinding.getPath().split("/").pop() : "";
            
            if (!VH_CONFIG[sPath]) {
                // 대소문자 문제 체크 (예: Kostl vs kostl)
                var sKey = Object.keys(VH_CONFIG).find(function(k) { return k.toLowerCase() === sPath.toLowerCase(); });
                if (sKey) { sPath = sKey; }
                else { return; }
            }
            this._sCurrentVHField = sPath;

            if (!this._oVHDialog) {
                this._oVHDialog = this._createVHDialog();
                this.getView().addDependent(this._oVHDialog);
            }
            
            var oConf = VH_CONFIG[sPath];
            this._oVHDialog.setTitle(oConf.title);
            this._updateVHColumns(oConf);
            this._loadVH("");
            this._oVHDialog.open();
        },

        _createVHDialog: function () {
            var oDialog = new Dialog({
                contentWidth: "700px",
                contentHeight: "500px",
                resizable: true,
                draggable: true,
                content: [
                    new SearchField({
                        width: "100%",
                        placeholder: "검색어 입력...",
                        search:     this._onSearchVH.bind(this),
                        liveChange: this._onSearchVH.bind(this)
                    }),
                    new MTable({
                        mode: "SingleSelectMaster",
                        growing: true,
                        growingScrollToLoad: true,
                        noDataText: "검색 결과가 없습니다",
                        itemPress: this._onVHSelect.bind(this)
                    })
                ],
                endButton: new MButton({
                    text: "닫기",
                    press: function () { oDialog.close(); }
                })
            });
            return oDialog;
        },

        _updateVHColumns: function (oConf) {
            var oTable = this._oVHDialog.getContent()[1];
            oTable.removeAllColumns();
            oConf.columns.forEach(function (col) {
                oTable.addColumn(new MColumn({
                    header: new MText({ text: col.label }),
                    width: col.width || "auto"
                }));
            });
        },

        _loadVH: function (sQuery) {
            var oTable = this._oVHDialog.getContent()[1];
            var oConf = VH_CONFIG[this._sCurrentVHField];
            var oModel = this.getView().getModel();

            oTable.setBusy(true);
            
            // OData V4 필터링 (간소화)
            var oListBinding = oModel.bindList(oConf.entity);
            
            oListBinding.requestContexts(0, 50).then(function (aContexts) {
                var aData = aContexts.map(function (oCtx) { return oCtx.getObject(); });
                
                // 검색 쿼리 적용 (클라이언트 측 필터링)
                if (sQuery) {
                    var sLower = sQuery.toLowerCase();
                    aData = aData.filter(function (o) {
                        return Object.values(o).some(function (val) {
                            return String(val).toLowerCase().indexOf(sLower) !== -1;
                        });
                    });
                }

                var oVHModel = new JSONModel(aData);
                oTable.setModel(oVHModel, "vh");
                oTable.bindItems({
                    path: "vh>/",
                    template: new ColumnListItem({
                        type: "Active",
                        cells: oConf.columns.map(function (col) {
                            return new MText({ text: "{vh>" + col.path + "}" });
                        })
                    })
                });
            }.bind(this)).catch(function (oErr) {
                MessageToast.show("데이터 로드 실패");
            }).finally(function () {
                oTable.setBusy(false);
            });
        },

        _onSearchVH: function (oEvent) {
            var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue") || "";
            this._loadVH(sQuery);
        },

        _onVHSelect: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oData = oItem.getBindingContext("vh").getObject();
            var oConf = VH_CONFIG[this._sCurrentVHField];
            
            this.getView().getModel("form").setProperty("/" + this._sCurrentVHField, oData[oConf.key]);
            this._oVHDialog.close();
        },

        // ══════════════════════════════════════════════
        // 유효성 검사
        // ══════════════════════════════════════════════
        _validate: function () {
            var d = this.getView().getModel("form").getData();
            var aErr = [];

            if (!d.Anltx || !d.Anltx.trim())    aErr.push("자산명칭");
            if (!d.Anlkl)                         aErr.push("자산분류");
            if (!d.Aktiv)                         aErr.push("취득일");
            if (!d.Anschw || d.Anschw === "")     aErr.push("취득가액");
            if (!d.Afamid)                         aErr.push("상각방법");
            if (!d.Ndjar  || d.Ndjar === "")       aErr.push("내용연수");
            if (!d.Werks)                          aErr.push("플랜트");
            if (!d.Waers  || d.Waers.trim() === "") aErr.push("통화");

            if (aErr.length) {
                MessageBox.error("필수 항목을 입력하세요:\n\n• " + aErr.join("\n• "));
                return false;
            }
            return true;
        },

        // ══════════════════════════════════════════════
        // OData 페이로드 빌드
        // ══════════════════════════════════════════════
        _buildPayload: function () {
            var d = this.getView().getModel("form").getData();
            var fAnschw  = parseFloat(String(d.Anschw).replace(/,/g, ""))  || 0;
            var fSalvage = parseFloat(String(d.Salvage).replace(/,/g, "")) || 0;

            var oPayload = {
                Bukrs:   d.Bukrs,
                Anltx:   d.Anltx.trim(),
                Anlkl:   d.Anlkl,
                Saknr:   d.Saknr   || "",
                Afaknr:  d.Afaknr  || "",
                Aufaknr: d.Aufaknr || "",
                Aktiv:   d.Aktiv,
                Anschw:  String(fAnschw),
                Salvage: String(fSalvage),
                Ndjar:   String(d.Ndjar || "0"),
                Afamid:  d.Afamid,
                Werks:   d.Werks,
                Kostl:   d.Kostl  || "",
                Prctr:   d.Prctr  || "",
                Lifnr:   d.Lifnr  || "",
                Status:  d.Status || "1",
                Waers:   d.Waers.trim()
            };
            if (d.Anlnr && d.Anlnr.trim()) {
                oPayload.Anlnr = d.Anlnr.trim();
            }
            return oPayload;
        },

        // ══════════════════════════════════════════════
        // 생성: POST /Asset → Activate → Detail 이동
        // ══════════════════════════════════════════════
        onSave: function () {
            if (!this._validate()) { return; }

            var oView = this.getView();
            oView.setBusy(true);

            var oModel      = oView.getModel();
            var oListBinding = oModel.bindList("/Asset");
            var oPayload    = this._buildPayload();
            var oNewCtx     = oListBinding.create(oPayload);

            oNewCtx.created()
                .then(function () {
                    var oActivate = oModel.bindContext(ACTION_NS + "Activate(...)", oNewCtx);
                    return oActivate.execute("$auto");
                })
                .then(function () {
                    MessageToast.show("자산이 성공적으로 생성되었습니다.");
                    var sBukrs = oNewCtx.getProperty("Bukrs") || "8282";
                    var sAnlnr = (oNewCtx.getProperty("Anlnr") || "").trim();
                    oView.getOwnerComponent().getRouter().navTo("RouteDetail", {
                        Bukrs: encodeURIComponent(sBukrs),
                        Anlnr: encodeURIComponent(sAnlnr),
                        IsActiveEntity: "true"
                    }, true);
                })
                .catch(function (oError) {
                    MessageBox.error(
                        "자산 생성 실패:\n" +
                        (oError.message || "서버 오류. 입력 내용을 확인하세요.")
                    );
                })
                .finally(function () {
                    oView.setBusy(false);
                });
        },

        // ══════════════════════════════════════════════
        // 드래프트 무시 / 취소
        // ══════════════════════════════════════════════
        onDiscard: function () {
            var d = this.getView().getModel("form").getData();
            var bHasInput = !!(d.Anltx || d.Anlkl || d.Werks || d.Afamid || d.Anschw);

            if (!bHasInput) {
                this._navToList();
                return;
            }
            MessageBox.confirm("입력한 내용을 버리고 목록으로 돌아가시겠습니까?", {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.CANCEL,
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) { this._navToList(); }
                }.bind(this)
            });
        },

        _navToList: function () {
            this.getOwnerComponent().getRouter()
                .navTo("Routecl3_3_fi_project_0007", {}, true);
        }
    });
});

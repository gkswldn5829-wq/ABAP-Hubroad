/*
 * ═══════════════════════════════════════════════════════════════
 * 컨트롤러 : cl3_3_fi_project_0002.controller.js
 * 화면     : 전표 상세조회 (Document Detail)
 * OData    : /DocDetailSet
 * 주요 흐름:
 *   onInit → (URL 파라미터 확인) → _loadData(OData 조회)
 *     → _processData(데이터 가공) → viewModel 업데이트 → 화면 갱신
 *   탐색도움말: onVHOpen → _loadVHData → onVHItemSelect → _loadData
 * ═══════════════════════════════════════════════════════════════
 */
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/format/NumberFormat",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox"
], function (Controller, JSONModel, Filter, FilterOperator, Sorter,
    DateFormat, NumberFormat, History, MessageBox) {
    "use strict";

    /* ══════════════════════════════════════════════════════════════
     * 모듈 레벨 — 공통 포맷터 (모듈 로드 시 한 번만 생성)
     *   _dateFmt : yyyy.MM.dd 형식 날짜 포맷터
     *   _numFmt  : 천 단위 쉼표, 소수점 없음 숫자 포맷터
     * ══════════════════════════════════════════════════════════════ */
    var _dateFmt = DateFormat.getDateInstance({ pattern: "yyyy.MM.dd" });
    var _numFmt = NumberFormat.getFloatInstance({
        groupingEnabled: true, maxFractionDigits: 0, minFractionDigits: 0
    });

    /* 회사코드 고정값 — 변경 시 여기서만 수정 */
    var _BUKRS = "8282";

    /* ══════════════════════════════════════════════════════════════
     * 전표유형 코드 맵 (_blartMap)
     *   OData의 Blart 코드(2자리) → 화면 표시용 한국어 설명
     *   ※ 새 전표유형 추가 시 여기에 "코드": "코드 · 설명" 형식으로 추가하고
     *     onInit의 blartList 배열에도 { code, desc } 항목을 추가하세요.
     * ══════════════════════════════════════════════════════════════ */
    var _blartMap = {
        "AA": "AA · 자산 전기",
        "AB": "AB · 일반 역분개 전표",
        "AF": "AF · 감가상각 전기",
        "DA": "DA · 고객 전표 역분개",
        "DR": "DR · 고객 매출 송장",
        "DZ": "DZ · 고객 대금 수금",
        "EX": "EX · 외부 I/F 전표",
        "KA": "KA · 벤더 전표 역분개",
        "KR": "KR · 벤더 매입 송장",
        "KZ": "KZ · 벤더 대금 지급",
        "RE": "RE · 물류 송장",
        "RV": "RV · 대금 청구",
        "SA": "SA · 일반 G/L 전표",
        "WA": "WA · 자재 출고",
        "WE": "WE · 자재 입고",
        "WL": "WL · 납품 출고",
        "ZP": "ZP · 지불전표"
    };

    /* ── 포맷팅 헬퍼 함수 ──────────────────────────────────────── */

    /* 날짜 → "yyyy.MM.dd" 문자열 (변환 실패 시 "—") */
    function _fmtDate(v) {
        if (!v) return "—";
        try { return _dateFmt.format(v instanceof Date ? v : new Date(v)); } catch (e) { return "—"; }
    }

    /* 숫자 → 천 단위 쉼표 문자열 (없으면 "—") */
    function _fmtNum(v) {
        if (v === null || v === undefined || v === "") return "—";
        var n = parseFloat(v);
        return isNaN(n) ? "—" : _numFmt.format(n);
    }

    /* ══════════════════════════════════════════════════════════════
     * 샘플(Mock) 데이터 — 화면 초기 표시용
     *   OData 조회 전 또는 조회 실패 시 이 데이터로 화면을 채웁니다.
     *   ※ 수정 포인트:
     *     - 초기 표시 전표를 바꾸려면 _mockHeader.Belnr 과 _mockItems 수정
     *     - 샘플 표시를 끄려면 onInit의 hasData: false 로 변경
     * ══════════════════════════════════════════════════════════════ */
    var _mockHeader = {
        Belnr: "2001000001", status: "ok",
        blartText: "DR · 고객 매출 송장",
        budatFormatted: "2026.03.15", bldatFormatted: "2026.03.15",
        gjahrMonat: "2026 / 03",
        waersAmount: "KRW  38,500,000",
        Bktxt: "세금계산서 현대그린푸드",
        netdtFormatted: "2026.06.14",
        augblDisplay: "—", augdtDisplay: "—",
        lastChanged: "최종변경 2026.03.15 · NCODE-C-27"
    };

    /* 샘플 라인 아이템 (3줄: 매출채권/제품매출/부가세) */
    var _mockItems = [
        {
            Buzei: "001", Saknr: "1100000006", SaknrTxt50: "매출채권", Shkzg: "S", Bschl: "01",
            iWrbtrFormatted: "38,500,000", Sgtxt: "매출채권 현대그린푸드", ccPc: "—", werksDisplay: "1000"
        },
        {
            Buzei: "002", Saknr: "4100000004", SaknrTxt50: "제품매출", Shkzg: "H", Bschl: "50",
            iWrbtrFormatted: "35,000,000", Sgtxt: "낙곱새밀키트 매출", ccPc: "PC1000", werksDisplay: "1000"
        },
        {
            Buzei: "003", Saknr: "2100000006", SaknrTxt50: "부가세", Shkzg: "H", Bschl: "50",
            iWrbtrFormatted: "3,500,000", Sgtxt: "부가세 매출세액", ccPc: "—", werksDisplay: "—"
        }
    ];

    /* 샘플 세금계산서 정보 */
    var _mockTax = {
        taxBelnr: "214-86-57903-2026-0000000002",
        taxDateFormatted: "2026.03.15",
        fwbasFormatted: "35,000,000",
        wmwstFormatted: "3,500,000",
        totalFormatted: "38,500,000"
    };

    /* ═══════════════════════════════════════════════════════════════ */
    return Controller.extend("cl327ns.fiprojectmodulename.controller.cl3_3_fi_project_0002", {

        /* ══════════════════════════════════════════════════════════
         * [섹션 1] 초기화
         *   - viewModel(JSONModel) 생성 및 초기 샘플 데이터 세팅
         *   - 라우터 패턴 이벤트 연결
         *   - 파라미터 수신 우선순위:
         *       1순위: Fiori Launchpad CrossApplicationNavigation startupParameters
         *              (0001에서 전표번호 링크 클릭 시 이 경로로 옴)
         *       2순위: URL hash (#?Belnr=...&Gjahr=...) 직접 접근
         *       3순위: 사용자 수동 입력 후 조회 버튼
         *
         *   viewModel 주요 프로퍼티:
         *     /busy       : 로딩 스피너
         *     /hasData    : KPI/헤더/라인아이템 섹션 표시 여부
         *     /belnr      : 입력 전표번호 (inputBelnr 바인딩)
         *     /gjahr      : 입력 회계연도 (inputGjahr 바인딩)
         *     /header     : 전표 헤더 메타데이터 (8개 필드)
         *     /items      : 라인 아이템 배열
         *     /debitLabel : 차변 pill 텍스트
         *     /creditLabel: 대변 pill 텍스트
         *     /isBalanced : 균형 칩 표시 여부
         *     /showTax    : 세금계산서 섹션 표시 여부 (DR 전표만 true)
         *     /tax        : 세금계산서 데이터
         *     /kpiXxx     : KPI 카드 값들
         *     /vhItems    : 탐색도움말 전표 목록
         *     /blartList  : 전표유형 탐색도움말 목록 (고정)
         * ══════════════════════════════════════════════════════════ */
        onNavBack: function () {
            window.history.go(-1);
        },

        onInit: function () {
            var oVM = new JSONModel({
                busy: false,
                hasData: true,          // 초기에 샘플 데이터 표시
                belnr: "2001000001",
                gjahr: "2026",
                header: JSON.parse(JSON.stringify(_mockHeader)),
                items: JSON.parse(JSON.stringify(_mockItems)),
                debitLabel: "차변   38,500,000",
                creditLabel: "대변   38,500,000",
                isBalanced: true,
                showTax: true,
                itemCount: "3 라인",
                footerTotal: "38,500,000",
                tax: JSON.parse(JSON.stringify(_mockTax)),
                /* KPI 카드 초기값 */
                kpiType: "DR · 고객 매출 송장",
                kpiDate: "2026.03.15",
                kpiDebit: "38,500,000",
                kpiCredit: "38,500,000",
                kpiBalance: "✓  균형",
                /* 탐색도움말 */
                vhItems: [],
                /* 전표유형 고정 목록 — _blartMap과 동기화 유지 */
                blartList: [
                    { code: "AA", desc: "자산 전기" },
                    { code: "AB", desc: "일반 역분개 전표" },
                    { code: "AF", desc: "감가상각 전기" },
                    { code: "DA", desc: "고객 전표 역분개" },
                    { code: "DR", desc: "고객 매출 송장" },
                    { code: "DZ", desc: "고객 대금 수금" },
                    { code: "EX", desc: "외부 I/F 전표" },
                    { code: "KA", desc: "벤더 전표 역분개" },
                    { code: "KR", desc: "벤더 매입 송장" },
                    { code: "KZ", desc: "벤더 대금 지급" },
                    { code: "RE", desc: "물류 송장" },
                    { code: "RV", desc: "대금 청구" },
                    { code: "SA", desc: "일반 G/L 전표" },
                    { code: "WA", desc: "자재 출고" },
                    { code: "WE", desc: "자재 입고" },
                    { code: "WL", desc: "납품 출고" }
                ]
            });
            this.getView().setModel(oVM, "viewModel");

            /* 라우터 패턴 매칭 이벤트 연결 */
            this.getOwnerComponent()
                .getRouter()
                .getRoute("Routecl3_3_fi_project_0002")
                .attachPatternMatched(this._onRouteMatched, this);

            /* 1순위: Fiori Launchpad startupParameters (Belnr, Gjahr) */
            var oComponentData = this.getOwnerComponent().getComponentData();
            var oStartup = (oComponentData && oComponentData.startupParameters) || {};
            var sLpBelnr = (oStartup.Belnr && oStartup.Belnr[0]) || "";
            var sLpGjahr = (oStartup.Gjahr && oStartup.Gjahr[0]) || "";
            if (sLpBelnr && sLpGjahr) {
                oVM.setProperty("/belnr", sLpBelnr);
                oVM.setProperty("/gjahr", sLpGjahr);
                this._loadData();
                return;
            }

            /* 2순위: URL hash (#?Belnr=...&Gjahr=...) — window.open fallback */
            setTimeout(function () {
                var sHash = decodeURIComponent(window.location.hash || "");
                var sQuery = sHash.replace(/^#\?/, "");
                if (!sQuery) return;

                var oParams = new URLSearchParams(sQuery);
                var sBelnr = oParams.get("Belnr");
                var sGjahr = oParams.get("Gjahr");

                if (sBelnr && sGjahr) {
                    oVM.setProperty("/belnr", sBelnr);
                    oVM.setProperty("/gjahr", sGjahr);
                    this._loadData();
                }
            }.bind(this), 300);
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 2] 라우트 파라미터 처리
         *   URL 라우팅으로 진입 시 query 파라미터에서 Belnr/Gjahr 추출
         *   예: #/Routecl3_3_fi_project_0002?Belnr=2001000001&Gjahr=2026
         * ══════════════════════════════════════════════════════════ */
        _onRouteMatched: function (oEvent) {
            var oQ = ((oEvent.getParameter("arguments") || {})["?query"]) || {};
            var oVM = this.getView().getModel("viewModel");
            if (oQ.Belnr) oVM.setProperty("/belnr", oQ.Belnr);
            if (oQ.Gjahr) oVM.setProperty("/gjahr", oQ.Gjahr);
            if (oQ.Belnr && oQ.Gjahr) { this._loadData(); }
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 3] 조회 버튼 핸들러
         *   View XML에서 Button press="onSearch" 로 연결
         *   Input submit="onSearch" 로도 연결 (Enter 키 조회)
         * ══════════════════════════════════════════════════════════ */
        onSearch: function () {
            this._loadData();
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 4] OData 조회 (_loadData)
         *   - /DocDetailSet 읽기
         *   - 필터: Bukrs(고정8282) / Gjahr / Belnr
         *   - 정렬: Buzei(항목번호) 오름차순
         *   - 결과 없으면 샘플 데이터 (_applyMock)
         *   - OData 오류도 샘플 데이터 표시 후 오류 메시지
         *
         *   ※ 수정 포인트:
         *     - 조회 조건 추가: aFilters 배열에 Filter 추가
         *     - 정렬 변경: Sorter 두 번째 인자 true = 내림차순
         * ══════════════════════════════════════════════════════════ */
        _loadData: function () {
            var oVM = this.getView().getModel("viewModel");
            var sBelnr = (oVM.getProperty("/belnr") || "").trim();
            var sGjahr = (oVM.getProperty("/gjahr") || "").trim();

            if (!sBelnr || !sGjahr) {
                MessageBox.warning("전표번호와 회계연도를 입력하세요.");
                return;
            }

            oVM.setProperty("/busy", true);

            this.getOwnerComponent().getModel().read("/DocDetailSet", {
                filters: [
                    new Filter("Bukrs", FilterOperator.EQ, _BUKRS),
                    new Filter("Gjahr", FilterOperator.EQ, sGjahr),
                    new Filter("Belnr", FilterOperator.EQ, sBelnr)
                ],
                sorters: [new Sorter("Buzei", false)], // 항목번호 오름차순
                success: function (oData) {
                    oVM.setProperty("/busy", false);
                    var aRes = oData.results || [];
                    if (!aRes.length) {
                        MessageBox.information("[" + sBelnr + "] 전표를 찾을 수 없습니다.\n샘플 데이터를 표시합니다.");
                        this._applyMock();
                        return;
                    }
                    this._processData(aRes);
                }.bind(this),
                error: function () {
                    oVM.setProperty("/busy", false);
                    MessageBox.error("데이터 조회 중 오류가 발생했습니다.\n샘플 데이터를 표시합니다.");
                    this._applyMock();
                }.bind(this)
            });
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 5] 샘플 데이터 복원 (_applyMock)
         *   OData 오류 또는 결과 없을 때 _mockHeader / _mockItems / _mockTax 로 복원
         *   ※ 샘플 데이터 내용 변경: 파일 상단의 _mockXxx 변수 수정
         * ══════════════════════════════════════════════════════════ */
        _applyMock: function () {
            var oVM = this.getView().getModel("viewModel");
            oVM.setProperty("/header",      JSON.parse(JSON.stringify(_mockHeader)));
            oVM.setProperty("/items",       JSON.parse(JSON.stringify(_mockItems)));
            oVM.setProperty("/tax",         JSON.parse(JSON.stringify(_mockTax)));
            oVM.setProperty("/debitLabel",  "차변   38,500,000");
            oVM.setProperty("/creditLabel", "대변   38,500,000");
            oVM.setProperty("/isBalanced",  true);
            oVM.setProperty("/showTax",     true);
            oVM.setProperty("/itemCount",   "3 라인");
            oVM.setProperty("/footerTotal", "38,500,000");
            oVM.setProperty("/kpiType",     "DR · 고객 매출 송장");
            oVM.setProperty("/kpiDate",     "2026.03.15");
            oVM.setProperty("/kpiDebit",    "38,500,000");
            oVM.setProperty("/kpiCredit",   "38,500,000");
            oVM.setProperty("/kpiBalance",  "✓  균형");
            oVM.setProperty("/hasData",     true);
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 6] OData 결과 데이터 가공 (_processData)
         *   입력: aRes — DocDetailSet OData 결과 배열 (각 행 = 라인 아이템)
         *
         *   처리 단계:
         *   1) 상태 결정 (역전표 > 반제완료 > 가전기 > 전기완료)
         *   2) 헤더 객체 생성 (oHeader)
         *   3) 라인 아이템 가공 (aItems)
         *        - 차변(S)/대변(H) 구분 + 금액 합산
         *        - ccPc: 코스트센터(Kostl) 또는 이익센터(Prctr)
         *   4) 균형 판정: |차변 - 대변| < 0.01
         *   5) 세금계산서 처리 (DR 전표만)
         *        - TaxBelnr, Fwbas(공급가), Wmwst(세액) 합산
         *   6) viewModel 업데이트
         *
         *   ※ 수정 포인트:
         *     - 상태 조건: sStatus 결정 로직 (Stblg/Augbl/Zstat)
         *     - 세금계산서 표시 조건: bShowTax (현재 DR만)
         *     - 균형 허용 오차: 0.01 (현재값)
         * ══════════════════════════════════════════════════════════ */
        _processData: function (aRes) {
            var oVM = this.getView().getModel("viewModel");
            var o = aRes[0]; // 헤더 정보는 첫 번째 행에서 추출

            /* 1) 전표 상태 결정 (우선순위: 역전표 > 반제 > 가전기 > 정상) */
            var sStatus = "ok";
            if (o.Stblg && o.Stblg.trim()) sStatus = "rv";       // 역전표
            else if (o.Augbl && o.Augbl.trim()) sStatus = "cl";  // 반제완료
            else if (o.Zstat === "A") sStatus = "pk";            // 가전기

            /* 2) 헤더 객체 생성 */
            var sVencode = (o.Vencode && o.Vencode.trim()) ? o.Vencode.trim() : o.Bukrs;
            var oHeader = {
                Belnr: o.Belnr,
                status: sStatus,
                blartText: _blartMap[o.Blart] || (o.Blart || ""),
                budatFormatted: _fmtDate(o.Budat),
                bldatFormatted: _fmtDate(o.Bldat),
                gjahrMonat: (o.Gjahr || "") + " / " + (o.Monat || ""),
                waersAmount: (o.Waers || "") + "  " + _fmtNum(o.HWrbtr),
                Bktxt: (o.Bktxt && o.Bktxt.trim()) ? o.Bktxt.trim() : "—",
                netdtFormatted: _fmtDate(o.Netdt),
                augblDisplay: (o.Augbl && o.Augbl.trim()) ? o.Augbl.trim() : "—",
                augdtDisplay: (o.Augdt) ? _fmtDate(o.Augdt) : "—",
                lastChanged: "최종변경 " + _fmtDate(o.Budat) + " · " + sVencode
            };

            /* 3) 라인 아이템 가공 + 차변/대변 합산 */
            var nDebit = 0, nCredit = 0;
            var aItems = aRes.map(function (r) {
                var nAmt = Math.abs(parseFloat(r.IWrbtr) || 0);
                if (r.Shkzg === "S") nDebit  += nAmt;  // 차변
                else                 nCredit += nAmt;  // 대변

                // 코스트센터 → 이익센터 순으로 표시 (둘 다 없으면 "—")
                var sCcPc = ((r.Kostl || "").trim()) || ((r.Prctr || "").trim()) || "—";
                return {
                    Buzei: r.Buzei,
                    Saknr: r.Saknr,
                    SaknrTxt50: (r.SaknrTxt50 || r.SaknrTxt20 || "").trim(),
                    Shkzg: r.Shkzg,
                    Bschl: r.Bschl,
                    iWrbtrFormatted: _fmtNum(nAmt),
                    Sgtxt: (r.Sgtxt && r.Sgtxt.trim()) ? r.Sgtxt.trim() : "—",
                    ccPc: sCcPc,
                    werksDisplay: (r.Werks && r.Werks.trim()) ? r.Werks.trim() : "—"
                };
            });

            /* 4) 균형 판정 (허용 오차 0.01) */
            var bBalanced = Math.abs(nDebit - nCredit) < 0.01;

            /* 5) 세금계산서 처리 (DR 전표만 표시) */
            var bShowTax = (o.Blart === "DR");
            var oTax = {};
            if (bShowTax) {
                var nFwbas = 0, nWmwst = 0, oTaxRec = null;
                aRes.forEach(function (r) {
                    nFwbas += parseFloat(r.Fwbas) || 0;  // 공급가액 합산
                    nWmwst += parseFloat(r.Wmwst) || 0;  // 세액 합산
                    if (!oTaxRec && r.TaxBelnr && r.TaxBelnr.trim()) oTaxRec = r;
                });
                oTaxRec = oTaxRec || o;
                oTax = {
                    taxBelnr:        (oTaxRec.TaxBelnr && oTaxRec.TaxBelnr.trim()) ? oTaxRec.TaxBelnr.trim() : "—",
                    taxDateFormatted: _fmtDate(oTaxRec.TaxDate),
                    fwbasFormatted:   _fmtNum(nFwbas || parseFloat(o.Fwbas) || 0),
                    wmwstFormatted:   _fmtNum(nWmwst || parseFloat(o.Wmwst) || 0),
                    totalFormatted:   _fmtNum(parseFloat(o.HWrbtr) || 0)
                };
            }

            /* 6) viewModel 전체 업데이트 */
            oVM.setProperty("/header",      oHeader);
            oVM.setProperty("/items",       aItems);
            oVM.setProperty("/debitLabel",  "차변   " + _fmtNum(nDebit));
            oVM.setProperty("/creditLabel", "대변   " + _fmtNum(nCredit));
            oVM.setProperty("/isBalanced",  bBalanced);
            oVM.setProperty("/showTax",     bShowTax);
            oVM.setProperty("/tax",         oTax);
            oVM.setProperty("/itemCount",   aItems.length + " 라인");
            oVM.setProperty("/footerTotal", _fmtNum(Math.max(nDebit, nCredit)));
            oVM.setProperty("/kpiType",     _blartMap[o.Blart] || (o.Blart || "—"));
            oVM.setProperty("/kpiDate",     _fmtDate(o.Budat));
            oVM.setProperty("/kpiDebit",    _fmtNum(nDebit));
            oVM.setProperty("/kpiCredit",   _fmtNum(nCredit));
            oVM.setProperty("/kpiBalance",  bBalanced ? "✓  균형" : "✗  불일치");
            oVM.setProperty("/hasData",     true);
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 7] 전표번호 탐색도움말 (dlgVH)
         * - onVHOpen      : 필터 초기화 후 팝업 오픈 → 최초 목록 로드
         * - onVHSearch    : 검색 버튼 / Enter → _loadVHData 호출
         * - _loadVHData   : 타임존 시차 버그 및 최하단 데이터 잘림 퍼펙트 픽스 버전
         * - onVHItemSelect: 행 클릭 → 전표번호 inputBelnr에 입력 → 팝업 닫기 → _loadData
         * - onVHClose     : 닫기 버튼
         * ══════════════════════════════════════════════════════════ */
        onVHOpen: function () {
            /* 이전 검색 조건 초기화 */
            this.byId("inputVHBelnr").setValue("");
            this.byId("dpVHBudat").setDateValue(null);
            this.byId("inputVHBlart").setValue("");
            this.byId("inputVHBktxt").setValue("");
            this.byId("dlgVH").open();
            this._loadVHData(); // 팝업 열릴 때 기본 목록 로드
        },

        onVHSearch: function () {
            this._loadVHData();
        },

        _loadVHData: function () {
            var oVM = this.getView().getModel("viewModel");
            var sBelnr = (this.byId("inputVHBelnr").getValue() || "").trim();
            var sGjahr = (this.byId("inputVHGjahr").getValue() || oVM.getProperty("/gjahr") || "").trim();
            var sBlart = (this.byId("inputVHBlart").getValue() || "").trim().toUpperCase();
            var sBktxt = (this.byId("inputVHBktxt").getValue() || "").trim();
            var oDate = this.byId("dpVHBudat").getDateValue();

            /* 필터 조립 (입력된 항목만 추가) */
            var aFilters = [new Filter("Bukrs", FilterOperator.EQ, _BUKRS)];
            if (sGjahr) aFilters.push(new Filter("Gjahr",  FilterOperator.EQ,       sGjahr));
            if (sBelnr) aFilters.push(new Filter("Belnr",  FilterOperator.Contains,  sBelnr));
            if (sBlart) aFilters.push(new Filter("Blart",  FilterOperator.EQ,        sBlart));
            if (sBktxt) aFilters.push(new Filter("Bktxt",  FilterOperator.Contains,  sBktxt));
            
            /* 🚀 [HANA OData 시차 버그 최종 킬러 치트키]
             * 백엔드 Gateway 시스템이 UTC 기준('-9시간')으로 날짜 필터를 역산하는 버그를 방어하기 위해
             * 날짜 문자열 끝에 시간대 마크인 'Z'를 빼거나, 아예 정오(12시)나 시차가 상쇄되는 시간으로 픽스해서 보냅니다.
             * 이렇게 던지면 백엔드에서 9시간을 빼더라도 무조건 '2026.05.13' 당일 구역에 갇히게 됩니다. */
            if (oDate) {
                var sYear  = oDate.getFullYear();
                var sMonth = String(oDate.getMonth() + 1).padStart(2, '0');
                var sDay   = String(oDate.getDate()).padStart(2, '0');
                
                // 시간대를 정오(낮 12시)로 강제 지정하여 백엔드에서 9시간이 빠져도 새벽 3시가 되어 당일 날짜가 유지되게 만듭니다.
                var sFormattedDate = sYear + "-" + sMonth + "-" + sDay + "T12:00:00";
                
                aFilters.push(new Filter("Budat", FilterOperator.EQ, sFormattedDate));
            }

            oVM.setProperty("/vhItems", []); // 기존 목록 초기화

            /* 🚀 [잘림 버그 해결] */
            var oDialog = this.byId("dlgVH");
            if (oDialog) {
                oDialog.setStretch(false);
            }

            // OData 서버 레이어 호출
            this.getOwnerComponent().getModel().read("/DocDetailSet", {
                filters: aFilters,
                urlParameters: { "$top": "300" },
                success: function (oData) {
                    var mSeen = {}, aVH = [];
                    /* 동일 전표번호 중복 제거 (첫 번째 행만 유지) */
                    (oData.results || []).forEach(function (r) {
                        if (!mSeen[r.Belnr]) {
                            mSeen[r.Belnr] = true;
                            aVH.push({
                                Belnr:      r.Belnr,
                                budatFmt:   _fmtDate(r.Budat),
                                Blart:      r.Blart || "—",
                                Bktxt:      (r.Bktxt && r.Bktxt.trim()) ? r.Bktxt.trim() : "—",
                                hwrbtrFmt:  _fmtNum(Math.abs(parseFloat(r.HWrbtr) || 0))
                            });
                        }
                    });
                    oVM.setProperty("/vhItems", aVH);
                    
                    /* 테이블 스크롤 컨테이너 바닥 잘림 강제 리프레시 */
                    setTimeout(function() {
                        var oTable = this.byId("tblVH");
                        if (oTable) { oTable.invalidate(); }
                    }.bind(this), 100);
                    
                }.bind(this),
                error: function () {
                    MessageBox.error("전표 목록 조회 중 오류가 발생했습니다.");
                }
            });
        },

        /* 행 선택: 전표번호 inputBelnr에 입력 → 팝업 닫기 → 전표 조회 */
        onVHItemSelect: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("viewModel");
            var sBelnr = oCtx.getProperty("Belnr");
            this.getView().getModel("viewModel").setProperty("/belnr", sBelnr);
            this.byId("dlgVH").close();
            this._loadData();
        },

        onVHClose: function () {
            this.byId("dlgVH").close();
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 8] 전표유형 탐색도움말 (dlgBlartVH)
         *   onBlartVHOpen      : 팝업 오픈
         *   onBlartVHItemSelect: 코드 선택 → inputVHBlart에 입력 → 팝업 닫기
         *   onBlartVHClose     : 닫기
         *   목록 데이터: viewModel>/blartList (onInit에서 고정 세팅)
         * ══════════════════════════════════════════════════════════ */
        onBlartVHOpen: function () {
            this.byId("dlgBlartVH").open();
        },

        onBlartVHItemSelect: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("viewModel");
            /* 선택한 코드를 전표번호 탐색도움말의 전표유형 필터 입력창에 입력 */
            this.byId("inputVHBlart").setValue(oCtx.getProperty("code"));
            this.byId("dlgBlartVH").close();
        },

        onBlartVHClose: function () {
            this.byId("dlgBlartVH").close();
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 9] 기타 버튼 핸들러
         *   onNavBack : 뒤로가기 (History.getPreviousHash 사용)
         *   onPrint   : 브라우저 인쇄 다이얼로그 호출 (CSS @media print 적용)
         *   onExport  : 내보내기 (현재 미구현 — 필요 시 여기 구현)
         *
         *   ※ 수정 포인트:
         *     - 내보내기 구현: onExport 에 Excel/CSV 로직 추가
         *       (0001의 _buildExcelHtml 참고)
         * ══════════════════════════════════════════════════════════ */
        onNavBack: function () {
            var sPrev = History.getInstance().getPreviousHash();
            if (sPrev !== undefined) { window.history.go(-1); }
        },

        onPrint: function () {
            window.print();
        },

        onExport: function () {
            MessageBox.information("내보내기 기능은 준비 중입니다.");
        }
    });
});

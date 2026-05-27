sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/odata/v2/ODataModel"
], function (Controller, JSONModel, MessageToast, MessageBox, History,
             SelectDialog, StandardListItem, Filter, FilterOperator, ODataModel) {
    "use strict";

    // 전기키 매핑 (차/대 + 전표유형)
    var BSCHL = {
        S: { SA: "40", DR: "01", KR: "40", RE: "40", AA: "40" },
        H: { SA: "50", DR: "50", KR: "31", RE: "31", AA: "50" }
    };

    // 계정과목 마스터 (탐색도움말)
    var ACCT_DATA = [
        { saknr: "1100000001", type: "A", name: "현금",               desc: "현금 및 현금성 자산" },
        { saknr: "1100000002", type: "A", name: "보통예금",           desc: "법인 은행 계좌 잔액" },
        { saknr: "1100000003", type: "A", name: "외상매출금",         desc: "SD 출고 후 미회수 매출채권" },
        { saknr: "1100000004", type: "A", name: "미수금",             desc: "영업 외 미회수 채권" },
        { saknr: "1100000005", type: "A", name: "선급관세",           desc: "수입 통관 전 선납 관세" },
        { saknr: "1100000006", type: "A", name: "매출채권",           desc: "외상매출금 포괄 집계 계정" },
        { saknr: "1100000007", type: "A", name: "단기대여금",         desc: "1년 이내 회수 대여금" },
        { saknr: "1100000008", type: "A", name: "선급금",             desc: "PO 선급 지급액" },
        { saknr: "1100000009", type: "A", name: "소모품",             desc: "사용 전 자산 처리 소모품" },
        { saknr: "1100000010", type: "A", name: "원재료",             desc: "가공 투입 전 재료 재고" },
        { saknr: "1100000011", type: "A", name: "제품",               desc: "자체 가공 완료 반제품 재고" },
        { saknr: "1100000012", type: "A", name: "완제품",             desc: "SD 출고 대기 완성 재고" },
        { saknr: "1100000013", type: "A", name: "GR/IR",              desc: "입고·인보이스 임시 정산" },
        { saknr: "1100000014", type: "A", name: "부가세대급금",       desc: "매입 부가세 환급 청구권" },
        { saknr: "1100000015", type: "A", name: "감가상각누계액",     desc: "유형자산 차감 평가 계정" },
        { saknr: "1100000016", type: "A", name: "대손충당금",         desc: "매출채권 회수불능 평가 계정" },
        { saknr: "1100000017", type: "A", name: "선급비용",           desc: "미래 비용을 선지급한 선급비용" },
        { saknr: "1300000001", type: "A", name: "토지",               desc: "감가상각 제외 비유동자산" },
        { saknr: "1300000002", type: "A", name: "건물",               desc: "정액법 내용연수 40년" },
        { saknr: "1300000003", type: "A", name: "기계장치",           desc: "냉장·가공설비 정률법" },
        { saknr: "1300000004", type: "A", name: "차량운반구",         desc: "배송차량 정률법" },
        { saknr: "1300000005", type: "A", name: "비품",               desc: "사무기기 정액법" },
        { saknr: "2100000001", type: "L", name: "외상매입금",         desc: "MM MIRO 인보이스 미지급" },
        { saknr: "2100000002", type: "L", name: "미지급금",           desc: "영업 외 미지급 비용" },
        { saknr: "2100000003", type: "L", name: "미지급비용",         desc: "결산 발생주의 조정" },
        { saknr: "2100000004", type: "L", name: "선수금",             desc: "고객 선수금 출고 시 대체" },
        { saknr: "2100000005", type: "L", name: "예수금",             desc: "원천세·4대보험 납부 대기" },
        { saknr: "2100000006", type: "L", name: "부가세",             desc: "부가세 신고 납부 의무" },
        { saknr: "2100000007", type: "L", name: "단기차입금",         desc: "1년 이내 만기 차입금" },
        { saknr: "2100000008", type: "L", name: "매입채권-조정",      desc: "GR/IR 수량·가격 차이 조정" },
        { saknr: "2100000009", type: "L", name: "미지급관세",         desc: "통관 확정 후 납부 대기 관세" },
        { saknr: "2100000010", type: "L", name: "부가세예수금",       desc: "매출 시 수취한 부가가치세 예수금" },
        { saknr: "2300000001", type: "L", name: "장기차입금",         desc: "1년 초과 만기 차입금" },
        { saknr: "2300000002", type: "L", name: "퇴직급여충당부채",   desc: "확정급여형 DB 부채" },
        { saknr: "3100000001", type: "Q", name: "자본금",             desc: "납입 자본금" },
        { saknr: "3100000002", type: "Q", name: "자본잉여금",         desc: "주식발행초과금 등" },
        { saknr: "3100000003", type: "Q", name: "이익잉여금",         desc: "전기이월 및 당기순이익" },
        { saknr: "3100000004", type: "Q", name: "기타포괄손익누계액", desc: "외화환산 미실현손익 OCI" },
        { saknr: "4100000001", type: "R", name: "매출",               desc: "매출" },
        { saknr: "4100000002", type: "R", name: "상품매출",           desc: "원물 식자재 유통 매출" },
        { saknr: "4100000003", type: "R", name: "매출에누리",         desc: "반품·할인 차감 계정" },
        { saknr: "4100000004", type: "R", name: "제품매출",           desc: "자체 가공 밀키트 매출" },
        { saknr: "4100000005", type: "R", name: "이자수익",           desc: "예금·대여금 이자" },
        { saknr: "4100000006", type: "R", name: "외환차익",           desc: "외화 결제 실현 환차익" },
        { saknr: "4100000007", type: "R", name: "외화환산이익",       desc: "결산 미실현 평가이익" },
        { saknr: "5100000001", type: "X", name: "상품매출원가",       desc: "SD PGI 출고 자동 전표" },
        { saknr: "5100000002", type: "X", name: "매출원가",           desc: "제품 생산·가공 원가" },
        { saknr: "5100000003", type: "X", name: "정상감모손실",       desc: "재고 감모·파손 손실" },
        { saknr: "5100000004", type: "X", name: "포장비",             desc: "밀키트 포장재·패키징" },
        { saknr: "5100000005", type: "X", name: "냉장냉동보관비",     desc: "콜드체인 창고 보관료" },
        { saknr: "5100000006", type: "X", name: "통관수수료",         desc: "수입 통관 대행 수수료" },
        { saknr: "5200000001", type: "X", name: "급여",               desc: "임직원 급여" },
        { saknr: "5200000002", type: "X", name: "복리후생비",         desc: "4대보험 사용자 부담분" },
        { saknr: "5200000003", type: "X", name: "여비교통비",         desc: "출장·교통 비용" },
        { saknr: "5200000004", type: "X", name: "수도광열비",         desc: "공장·창고 수도·전기·가스" },
        { saknr: "5200000005", type: "X", name: "차량유지비",         desc: "배송차량 연료·수리비" },
        { saknr: "5200000006", type: "X", name: "광고선전비",         desc: "마케팅·홍보 비용" },
        { saknr: "5200000007", type: "X", name: "운반비",             desc: "외부 물류·배송비" },
        { saknr: "5200000008", type: "X", name: "관세비",             desc: "수입 관세 확정 차액" },
        { saknr: "5200000009", type: "X", name: "감가상각비",         desc: "유형자산 정기 감가" },
        { saknr: "5200000010", type: "X", name: "퇴직급여",           desc: "확정급여형 DB 비용" },
        { saknr: "5300000001", type: "X", name: "이자비용",           desc: "차입금·사채 이자" },
        { saknr: "5300000002", type: "X", name: "외환차손",           desc: "외화 결제 실현 환차손" },
        { saknr: "5300000003", type: "X", name: "외화환산손실",       desc: "결산 미실현 평가손실" },
        { saknr: "5300000004", type: "X", name: "대손상각비",         desc: "매출채권 회수불능 비용" },
        { saknr: "5300000005", type: "X", name: "비정상감모손실",     desc: "통제 실패·설비고장 등 비정상 재고 손실" }
    ];
    var ACCT = {};
    ACCT_DATA.forEach(function(r) { ACCT[r.saknr] = r.name; });

    // 세율 매핑 (세금코드별)
    var TAX_RATE = {
        "": 0,
        "A0": 0,  "A1": 0,  "A2": 0,  "A3": 10, "A4": 10, "A5": 10, "A6": 10,
        "A8": 0,  "A9": 0,  "AA": 10, "AB": 10, "AC": 10,
        "B1": 10, "B2": 10, "B3": 10, "B4": 10, "B5": 10,
        "V0": 0,  "V1": 0,  "V2": 0,  "V3": 10, "V4": 10, "V5": 10, "V6": 10, "V7": 10
    };

    // 코스트센터 마스터 (탐색도움말)
    var KOSTL_DATA = [
        { kostl: "CC1010", plant: "1000", name: "오산 급식영업관리팀" },
        { kostl: "CC1020", plant: "1000", name: "오산 리테일영업팀" },
        { kostl: "CC1030", plant: "1000", name: "오산 영업지원팀" },
        { kostl: "CC1040", plant: "1000", name: "오산 구매관리팀" },
        { kostl: "CC1050", plant: "1000", name: "오산 물류운영팀" },
        { kostl: "CC1060", plant: "1000", name: "오산 생산계획팀" },
        { kostl: "CC1070", plant: "1000", name: "오산 품질관리팀" },
        { kostl: "CC1080", plant: "1000", name: "오산 재무회계팀" },
        { kostl: "CC2010", plant: "2000", name: "파주 급식영업관리팀" },
        { kostl: "CC2020", plant: "2000", name: "파주 리테일영업팀" },
        { kostl: "CC2030", plant: "2000", name: "파주 영업지원팀" },
        { kostl: "CC2040", plant: "2000", name: "파주 구매관리팀" },
        { kostl: "CC2050", plant: "2000", name: "파주 물류운영팀" },
        { kostl: "CC2060", plant: "2000", name: "파주 생산계획팀" },
        { kostl: "CC2070", plant: "2000", name: "파주 품질관리팀" },
        { kostl: "CC2080", plant: "2000", name: "파주 재무회계팀" },
        { kostl: "CC9000", plant: "",     name: "본사 공통" }
    ];

    // 플랜트 마스터 (탐색도움말)
    var WERKS_DATA = [
        { werks: "1000", name: "오산 플랜트" },
        { werks: "2000", name: "파주 플랜트" }
    ];

    // 세금코드 마스터 (탐색도움말)
    var MWSKZ_DATA = [
        { mwskz: "",   display: "—",  gubun: "—",   desc: "없음",                           rate: 0  },
        { mwskz: "A0", display: "A0", gubun: "매출", desc: "0% 매출 면세 – 계산서",          rate: 0  },
        { mwskz: "A1", display: "A1", gubun: "매출", desc: "0% 매출 면세 – 현금영수증",      rate: 0  },
        { mwskz: "A2", display: "A2", gubun: "매출", desc: "0% 매출 면세 – 신용카드",        rate: 0  },
        { mwskz: "A3", display: "A3", gubun: "매출", desc: "10% 매출 과세 – 신용카드",       rate: 10 },
        { mwskz: "A4", display: "A4", gubun: "매출", desc: "10% 매출 과세 – 현금영수증",     rate: 10 },
        { mwskz: "A5", display: "A5", gubun: "매출", desc: "10% 매출 과세 – 영수증",         rate: 10 },
        { mwskz: "A6", display: "A6", gubun: "매출", desc: "10% 매출 과세 – 기타",           rate: 10 },
        { mwskz: "A8", display: "A8", gubun: "매출", desc: "0% 매출 영세 – 로컬수출",        rate: 0  },
        { mwskz: "A9", display: "A9", gubun: "매출", desc: "0% 매출 영세 – 직수출",          rate: 0  },
        { mwskz: "AA", display: "AA", gubun: "매출", desc: "10% 매출 과세 – 세금계산서",     rate: 10 },
        { mwskz: "AB", display: "AB", gubun: "매출", desc: "10% 매출 과세 – 고정자산 매각",  rate: 10 },
        { mwskz: "AC", display: "AC", gubun: "매출", desc: "10% 매출 과세 – 직매장 공급",    rate: 10 },
        { mwskz: "B1", display: "B1", gubun: "매출", desc: "10% 매출 과세 – 사업상 증여",    rate: 10 },
        { mwskz: "B2", display: "B2", gubun: "매출", desc: "10% 매출 과세 – 개인적 공급",    rate: 10 },
        { mwskz: "B3", display: "B3", gubun: "매출", desc: "10% 매출 과세 – 기타 증여",      rate: 10 },
        { mwskz: "B4", display: "B4", gubun: "매출", desc: "10% 매출 과세 – 대리납부",       rate: 10 },
        { mwskz: "B5", display: "B5", gubun: "매출", desc: "10% 매출 과세 – 간주임대료",     rate: 10 },
        { mwskz: "V0", display: "V0", gubun: "매입", desc: "매입 면세 – 계산서",             rate: 0  },
        { mwskz: "V1", display: "V1", gubun: "매입", desc: "매입 면세 – 현금영수증",         rate: 0  },
        { mwskz: "V2", display: "V2", gubun: "매입", desc: "매입 면세 – 신용카드",           rate: 0  },
        { mwskz: "V3", display: "V3", gubun: "매입", desc: "10% 매입 과세 – 고정자산 매입",  rate: 10 },
        { mwskz: "V4", display: "V4", gubun: "매입", desc: "10% 매입 과세 – 불공제",         rate: 10 },
        { mwskz: "V5", display: "V5", gubun: "매입", desc: "10% 매입 과세 – 영수증",         rate: 10 },
        { mwskz: "V6", display: "V6", gubun: "매입", desc: "10% 매입 과세 – 신용카드",       rate: 10 },
        { mwskz: "V7", display: "V7", gubun: "매입", desc: "10% 매입 과세 – 현금영수증",     rate: 10 }
    ];

    // 손익센터 마스터 (탐색도움말)
    var PRCTR_DATA = [
        { prctr: "PC1000", plant: "1000", name: "오산 플랜트" },
        { prctr: "PC2000", plant: "2000", name: "파주 플랜트" },
        { prctr: "PC9000", plant: "",     name: "본사 공통" }
    ];

    var _lineIdx = 0;

    return Controller.extend("zc3fijiwoohan.cl3fiproject0004.controller.cl_3_fi_project_0004", {

        // ── 초기화 ──────────────────────────────────────────
        onInit: function () {
            var oToday = new Date();
            var sToday = this._toDateStr(oToday);

            var oViewModel = new JSONModel({
                blart:          "SA",
                budat:          sToday,
                bldat:          sToday,
                bktxt:          "",
                stodt:          "",
                waers:          "KRW",
                gjahr:          String(oToday.getFullYear()),
                monat:          String(oToday.getMonth() + 1).padStart(2, "0"),
                statusDisplay:  "작성중",
                statusState:    "Warning",
                debitSumText:   "0",
                creditSumText:  "0",
                diffText:       "—",
                lineCount:      0,
                lineCountTag:   "0개 라인",
                balStatusText:  "라인 입력 대기",
                balState:       "None",
                balIcon:        "sap-icon://information",
                tableRowCount:  2,
                items:          [],
                userName:       "",
                userPernr:      "",
                attachments:    [],
                attachCountTag: "",
                attachEmpty:    true
            });
            this.getView().setModel(oViewModel, "viewModel");
            _lineIdx = 0;
            this._addLine();
            this._addLine();
            this._loadHRData();

            // ── 파일 선택용 hidden input 생성
            var oInput = document.createElement("input");
            oInput.type     = "file";
            oInput.multiple = true;
            oInput.accept   = ".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx,.zip,.txt";
            oInput.style.display = "none";
            oInput.addEventListener("change", this._onFilesSelected.bind(this));
            document.body.appendChild(oInput);
            this._oFileInput = oInput;
        },

        // ── 헤더 이벤트 ─────────────────────────────────────
        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("Routecl_3_fi_project_0004", {}, true);
            }
        },

        onBudatChange: function () {
            var oModel = this.getView().getModel("viewModel");
            var sBudat = oModel.getProperty("/budat");
            if (sBudat && sBudat.length >= 7) {
                oModel.setProperty("/gjahr", sBudat.substring(0, 4));
                oModel.setProperty("/monat", sBudat.substring(5, 7));
            }
        },

        // ── 라인 아이템 ─────────────────────────────────────
        onAddLine: function () {
            this._addLine();
        },

        _addLine: function () {
            var oModel  = this.getView().getModel("viewModel");
            var sBlart  = oModel.getProperty("/blart") || "SA";
            var aItems  = oModel.getProperty("/items");
            _lineIdx++;
            aItems.push({
                lineNo:      String(aItems.length + 1).padStart(3, "0"),
                saknr:       "",
                saknrName:   "",
                shkzg:       "S",
                bschl:       BSCHL.S[sBlart] || "40",
                wrbtrInput:  "",
                wrbtr:       0,
                mwskz:       "",
                wmwst:       0,
                wmwstText:   "0",
                kostl:       "",
                werks:       "",
                prctr:       "",
                ptnr:        "",
                sgtxt:       "",
                _id:         _lineIdx
            });
            oModel.setProperty("/items", aItems);
            this._updateLineCount();
            this._calcBalance();
        },

        onDeleteLine: function (oEvent) {
            var oModel  = this.getView().getModel("viewModel");
            var oCtx    = oEvent.getSource().getBindingContext("viewModel");
            var iIndex  = parseInt(oCtx.getPath().split("/").pop(), 10);
            var aItems  = oModel.getProperty("/items");
            var oItem   = aItems[iIndex];
            var bHasData = !!(oItem.saknr || oItem.wrbtrInput || oItem.sgtxt || oItem.kostl || oItem.werks || oItem.ptnr);
            if (bHasData) {
                var that = this;
                MessageBox.confirm(
                    "저장된 데이터가 있는 행입니다. 삭제하시겠습니까?\n[" + oItem.lineNo + "] " +
                    (oItem.saknr || "") + (oItem.saknrName ? " · " + oItem.saknrName : ""),
                    { title: "행 삭제 확인", onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) { that._doDeleteLine(iIndex); }
                    }}
                );
            } else {
                this._doDeleteLine(iIndex);
            }
        },

        onDeleteLastLine: function () {
            var oModel = this.getView().getModel("viewModel");
            var aItems = oModel.getProperty("/items");
            if (!aItems.length) { MessageToast.show("삭제할 라인이 없습니다."); return; }
            var iIndex = aItems.length - 1;
            var oItem  = aItems[iIndex];
            var bHasData = !!(oItem.saknr || oItem.wrbtrInput || oItem.sgtxt || oItem.kostl || oItem.werks || oItem.ptnr);
            if (bHasData) {
                var that = this;
                MessageBox.confirm(
                    "저장된 데이터가 있습니다. 마지막 행을 삭제하시겠습니까?\n[" + oItem.lineNo + "] " +
                    (oItem.saknr || "") + (oItem.saknrName ? " · " + oItem.saknrName : ""),
                    { title: "행 삭제 확인", onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) { that._doDeleteLine(iIndex); }
                    }}
                );
            } else {
                this._doDeleteLine(iIndex);
            }
        },

        _doDeleteLine: function (iIndex) {
            var oModel = this.getView().getModel("viewModel");
            var aItems = oModel.getProperty("/items");
            aItems.splice(iIndex, 1);
            aItems.forEach(function (item, i) { item.lineNo = String(i + 1).padStart(3, "0"); });
            oModel.setProperty("/items", aItems);
            this._updateLineCount();
            this._calcBalance();
        },

        // ── 라인 필드 이벤트 ────────────────────────────────
        onSaknrChange: function (oEvent) {
            var oInput  = oEvent.getSource();
            var oCtx    = oInput.getBindingContext("viewModel");
            if (!oCtx) return;
            var oModel  = this.getView().getModel("viewModel");
            var sPath   = oCtx.getPath();
            var sVal    = oEvent.getParameter("value").trim();
            var sName   = ACCT[sVal] || (sVal.length === 10 ? "—" : "");
            oModel.setProperty(sPath + "/saknr",     sVal);
            oModel.setProperty(sPath + "/saknrName", sName);
            this._calcBalance();
        },

        onShkzgChange: function (oEvent) {
            var oSel    = oEvent.getSource();
            var oCtx    = oSel.getBindingContext("viewModel");
            if (!oCtx) return;
            var oModel  = this.getView().getModel("viewModel");
            var sPath   = oCtx.getPath();
            var sShkzg  = oEvent.getParameter("selectedItem").getKey();
            var sBlart  = oModel.getProperty("/blart") || "SA";
            oModel.setProperty(sPath + "/bschl", BSCHL[sShkzg][sBlart] || (sShkzg === "S" ? "40" : "50"));
            this._calcBalance();
        },

        onAmtChange: function (oEvent) {
            var oInput  = oEvent.getSource();
            var oCtx    = oInput.getBindingContext("viewModel");
            if (!oCtx) return;
            var oModel  = this.getView().getModel("viewModel");
            var sPath   = oCtx.getPath();
            var nAmt    = parseFloat(oEvent.getParameter("value").replace(/,/g, "")) || 0;
            var sMwskz  = oModel.getProperty(sPath + "/mwskz") || "";
            var nTax    = Math.round(nAmt * (TAX_RATE[sMwskz] || 0) / 100);
            oModel.setProperty(sPath + "/wrbtr",     nAmt);
            oModel.setProperty(sPath + "/wmwst",     nTax);
            oModel.setProperty(sPath + "/wmwstText", this._fmt(nTax));
            this._calcBalance();
        },

        onMwskzInputChange: function (oEvent) {
            var oInput  = oEvent.getSource();
            var oCtx    = oInput.getBindingContext("viewModel");
            if (!oCtx) return;
            var oModel  = this.getView().getModel("viewModel");
            var sPath   = oCtx.getPath();
            var sMwskz  = (oEvent.getParameter("value") || "").trim().toUpperCase();
            var nAmt    = parseFloat((oModel.getProperty(sPath + "/wrbtrInput") || "").replace(/,/g, "")) || 0;
            var nTax    = Math.round(nAmt * (TAX_RATE[sMwskz] || 0) / 100);
            oModel.setProperty(sPath + "/mwskz",     sMwskz);
            oModel.setProperty(sPath + "/wmwst",     nTax);
            oModel.setProperty(sPath + "/wmwstText", this._fmt(nTax));
            this._calcBalance();
        },

        // ── ValueHelp: 세금코드 (MWSKZ) ─────────────────────
        onMwskzValueHelp: function (oEvent) {
            this._oMwskzHelpCtx = oEvent.getSource().getBindingContext("viewModel");
            var that = this;
            if (!this._oMwskzDialog) {
                this._oMwskzDialog = new SelectDialog({
                    title:      "세금코드 탐색도움말",
                    noDataText: "세금코드를 찾을 수 없습니다",
                    search: function (oEvt) {
                        var sQ = oEvt.getParameter("value");
                        oEvt.getParameter("itemsBinding").filter([
                            new Filter([
                                new Filter("display", FilterOperator.Contains, sQ),
                                new Filter("desc",    FilterOperator.Contains, sQ),
                                new Filter("gubun",   FilterOperator.Contains, sQ)
                            ], false)
                        ]);
                    },
                    confirm: function (oEvt) {
                        var oSel = oEvt.getParameter("selectedItem");
                        if (!oSel || !that._oMwskzHelpCtx) return;
                        var oModel  = that.getView().getModel("viewModel");
                        var sPath   = that._oMwskzHelpCtx.getPath();
                        var sMwskz  = oSel.getBindingContext("dlg").getProperty("mwskz");
                        var nAmt    = parseFloat((oModel.getProperty(sPath + "/wrbtrInput") || "").replace(/,/g, "")) || 0;
                        var nTax    = Math.round(nAmt * (TAX_RATE[sMwskz] || 0) / 100);
                        oModel.setProperty(sPath + "/mwskz",     sMwskz);
                        oModel.setProperty(sPath + "/wmwst",     nTax);
                        oModel.setProperty(sPath + "/wmwstText", that._fmt(nTax));
                        that._calcBalance();
                    },
                    cancel: function () {}
                });
                this._oMwskzDialog.setModel(new JSONModel({ items: MWSKZ_DATA }), "dlg");
                this._oMwskzDialog.bindAggregation("items", {
                    path:     "dlg>/items",
                    template: new StandardListItem({
                        title:       "{dlg>display}",
                        description: "{dlg>desc}  ·  {dlg>gubun}  ·  {dlg>rate}%"
                    })
                });
                this.getView().addDependent(this._oMwskzDialog);
            }
            this._oMwskzDialog.open();
        },

        onKostlChange: function () { /* binding 처리 */ },

        // ── ValueHelp: 계정과목 (SAKNR) ──────────────────────
        onSaknrValueHelp: function (oEvent) {
            this._oSaknrHelpCtx = oEvent.getSource().getBindingContext("viewModel");
            var that = this;
            if (!this._oSaknrDialog) {
                this._oSaknrDialog = new SelectDialog({
                    title:      "계정과목 탐색도움말",
                    noDataText: "계정과목을 찾을 수 없습니다",
                    search: function (oEvt) {
                        var sQ = oEvt.getParameter("value");
                        oEvt.getParameter("itemsBinding").filter([
                            new Filter([
                                new Filter("saknr", FilterOperator.Contains, sQ),
                                new Filter("name",  FilterOperator.Contains, sQ),
                                new Filter("desc",  FilterOperator.Contains, sQ)
                            ], false)
                        ]);
                    },
                    confirm: function (oEvt) {
                        var oSel = oEvt.getParameter("selectedItem");
                        if (oSel && that._oSaknrHelpCtx) {
                            var oModel = that.getView().getModel("viewModel");
                            var sPath  = that._oSaknrHelpCtx.getPath();
                            var oCtx   = oSel.getBindingContext("dlg");
                            oModel.setProperty(sPath + "/saknr",     oCtx.getProperty("saknr"));
                            oModel.setProperty(sPath + "/saknrName", oCtx.getProperty("name"));
                            that._calcBalance();
                        }
                    },
                    cancel: function () {}
                });
                this._oSaknrDialog.setModel(new JSONModel({ items: [] }), "dlg");
                this._oSaknrDialog.bindAggregation("items", {
                    path:     "dlg>/items",
                    template: new StandardListItem({ title: "{dlg>saknr}", description: "{dlg>name}  ·  {dlg>desc}" })
                });
                this.getView().addDependent(this._oSaknrDialog);
                this._loadSaknrData();
            }
            this._oSaknrDialog.open();
        },

        _loadSaknrData: function () {
            var that = this;
            var oBsModel = new ODataModel("/sap/opu/odata/sap/ZCDS_C3_FI_0001_CDS/", { json: true });
            oBsModel.read("/BSdataSet", {
                urlParameters: { "$select": "Saknr,SaknrTxt50", "$top": "500" },
                success: function (oData) {
                    var oSeen = {}, aItems = [];
                    (oData.results || []).forEach(function (r) {
                        if (r.Saknr && !oSeen[r.Saknr]) {
                            oSeen[r.Saknr] = true;
                            aItems.push({ saknr: r.Saknr, name: r.SaknrTxt50 || "" });
                        }
                    });
                    aItems.sort(function (a, b) { return a.saknr.localeCompare(b.saknr); });
                    if (aItems.length) {
                        that._oSaknrDialog.getModel("dlg").setProperty("/items", aItems);
                    } else {
                        that._useFallbackAcct();
                    }
                },
                error: function () { that._useFallbackAcct(); }
            });
        },

        _useFallbackAcct: function () {
            this._oSaknrDialog.getModel("dlg").setProperty("/items", ACCT_DATA);
        },

        // ── ValueHelp: 코스트센터 (KOSTL) ────────────────────
        onKostlValueHelp: function (oEvent) {
            this._oKostlHelpCtx = oEvent.getSource().getBindingContext("viewModel");
            if (!this._oKostlDialog) {
                this._oKostlDialog = new SelectDialog({
                    title:      "코스트센터 탐색도움말",
                    noDataText: "코스트센터를 찾을 수 없습니다",
                    search: function (oEvt) {
                        var sQ = oEvt.getParameter("value");
                        oEvt.getParameter("itemsBinding").filter([
                            new Filter([
                                new Filter("kostl", FilterOperator.Contains, sQ),
                                new Filter("name",  FilterOperator.Contains, sQ)
                            ], false)
                        ]);
                    },
                    confirm: function (oEvt) {
                        var oSel = oEvt.getParameter("selectedItem");
                        if (!oSel || !this._oKostlHelpCtx) return;
                        var oModel  = this.getView().getModel("viewModel");
                        var sPath   = this._oKostlHelpCtx.getPath();
                        var oSelCtx = oSel.getBindingContext("dlg");
                        var sKostl  = oSelCtx.getProperty("kostl");
                        var sPlant  = oSelCtx.getProperty("plant");
                        var sPrctr  = sPlant === "1000" ? "PC1000" : sPlant === "2000" ? "PC2000" : "PC9000";
                        oModel.setProperty(sPath + "/kostl", sKostl);
                        if (sPlant) { oModel.setProperty(sPath + "/werks", sPlant); }
                        oModel.setProperty(sPath + "/prctr", sPrctr);
                    }.bind(this),
                    cancel: function () {}
                });
                this._oKostlDialog.setModel(new JSONModel({ items: KOSTL_DATA }), "dlg");
                this._oKostlDialog.bindAggregation("items", {
                    path:     "dlg>/items",
                    template: new StandardListItem({ title: "{dlg>kostl}", description: "{dlg>name}" })
                });
                this.getView().addDependent(this._oKostlDialog);
            }
            this._oKostlDialog.open();
        },

        // ── ValueHelp: 플랜트 (WERKS) ────────────────────────
        onWerksValueHelp: function (oEvent) {
            this._oWerksHelpCtx = oEvent.getSource().getBindingContext("viewModel");
            if (!this._oWerksDialog) {
                this._oWerksDialog = new SelectDialog({
                    title:      "플랜트 탐색도움말",
                    noDataText: "플랜트를 찾을 수 없습니다",
                    search: function (oEvt) {
                        var sQ = oEvt.getParameter("value");
                        oEvt.getParameter("itemsBinding").filter([
                            new Filter([
                                new Filter("werks", FilterOperator.Contains, sQ),
                                new Filter("name",  FilterOperator.Contains, sQ)
                            ], false)
                        ]);
                    },
                    confirm: function (oEvt) {
                        var oSel = oEvt.getParameter("selectedItem");
                        if (oSel && this._oWerksHelpCtx) {
                            this.getView().getModel("viewModel")
                                .setProperty(this._oWerksHelpCtx.getPath() + "/werks", oSel.getTitle());
                        }
                    }.bind(this),
                    cancel: function () {}
                });
                this._oWerksDialog.setModel(new JSONModel({ items: WERKS_DATA }), "dlg");
                this._oWerksDialog.bindAggregation("items", {
                    path:     "dlg>/items",
                    template: new StandardListItem({ title: "{dlg>werks}", description: "{dlg>name}" })
                });
                this.getView().addDependent(this._oWerksDialog);
            }
            this._oWerksDialog.open();
        },

        // ── ValueHelp: 손익센터 (PRCTR) ──────────────────────
        onPrctrValueHelp: function (oEvent) {
            this._oPrctrHelpCtx = oEvent.getSource().getBindingContext("viewModel");
            if (!this._oPrctrDialog) {
                this._oPrctrDialog = new SelectDialog({
                    title:      "손익센터 탐색도움말",
                    noDataText: "손익센터를 찾을 수 없습니다",
                    search: function (oEvt) {
                        var sQ = oEvt.getParameter("value");
                        oEvt.getParameter("itemsBinding").filter([
                            new Filter([
                                new Filter("prctr", FilterOperator.Contains, sQ),
                                new Filter("name",  FilterOperator.Contains, sQ)
                            ], false)
                        ]);
                    },
                    confirm: function (oEvt) {
                        var oSel = oEvt.getParameter("selectedItem");
                        if (oSel && this._oPrctrHelpCtx) {
                            this.getView().getModel("viewModel")
                                .setProperty(this._oPrctrHelpCtx.getPath() + "/prctr", oSel.getTitle());
                        }
                    }.bind(this),
                    cancel: function () {}
                });
                this._oPrctrDialog.setModel(new JSONModel({ items: PRCTR_DATA }), "dlg");
                this._oPrctrDialog.bindAggregation("items", {
                    path:     "dlg>/items",
                    template: new StandardListItem({ title: "{dlg>prctr}", description: "{dlg>name}" })
                });
                this.getView().addDependent(this._oPrctrDialog);
            }
            this._oPrctrDialog.open();
        },

        // ── 초기화 ──────────────────────────────────────────
        onReset: function () {
            var that = this;
            MessageBox.confirm("모든 입력 내용을 초기화하시겠습니까?", {
                title: "초기화 확인",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        that._resetForm();
                        MessageToast.show("초기화되었습니다.");
                    }
                }
            });
        },

        _resetForm: function () {
            var oToday = new Date();
            var sToday = this._toDateStr(oToday);
            var oModel = this.getView().getModel("viewModel");
            oModel.setProperty("/blart",         "SA");
            oModel.setProperty("/budat",         sToday);
            oModel.setProperty("/bldat",         sToday);
            oModel.setProperty("/bktxt",         "");
            oModel.setProperty("/stodt",         "");
            oModel.setProperty("/waers",         "KRW");
            oModel.setProperty("/gjahr",         String(oToday.getFullYear()));
            oModel.setProperty("/monat",         String(oToday.getMonth() + 1).padStart(2, "0"));
            oModel.setProperty("/statusDisplay",  "작성중");
            oModel.setProperty("/statusState",    "Warning");
            oModel.setProperty("/items",          []);
            oModel.setProperty("/attachments",    []);
            oModel.setProperty("/attachCountTag", "");
            oModel.setProperty("/attachEmpty",    true);
            _lineIdx = 0;
            this._addLine();
            this._addLine();
        },

        // ── 전표 저장 ────────────────────────────────────────
        onSave: function () {
            var oModel = this.getView().getModel("viewModel");
            var sBudat = oModel.getProperty("/budat");
            var sBldat = oModel.getProperty("/bldat");
            var aItems = oModel.getProperty("/items");

            if (!sBudat || !sBldat) {
                MessageBox.error("전기일과 증빙일을 입력하세요.");
                return;
            }
            if (!aItems || aItems.length === 0) {
                MessageBox.error("최소 1개 이상의 라인을 입력하세요.");
                return;
            }

            var bItemErr = false;
            var nDebit = 0, nCredit = 0;
            aItems.forEach(function (item) {
                var nAmt = parseFloat((item.wrbtrInput || "").replace(/,/g, "")) || 0;
                if ((item.saknr || "").trim().length !== 10) bItemErr = true;
                if (nAmt <= 0) bItemErr = true;
                if (item.shkzg === "S") nDebit  += nAmt;
                else                   nCredit += nAmt;
            });

            if (bItemErr) {
                MessageBox.error("라인 입력 오류를 확인하세요.\n계정번호 10자리 필수 / 금액 > 0");
                return;
            }
            if (Math.abs(nDebit - nCredit) > 0.01) {
                MessageBox.error("차대변이 일치하지 않습니다.\n차변: " + this._fmt(nDebit) + "  ≠  대변: " + this._fmt(nCredit));
                return;
            }

            var sWaers = oModel.getProperty("/waers");
            var oHeader = {
                Bukrs:  "8282",
                Blart:  "SA",
                Budat:  sBudat,
                Bldat:  sBldat,
                Bktxt:  oModel.getProperty("/bktxt"),
                Stodt:  oModel.getProperty("/stodt") || "",
                Waers:  sWaers,
                Gjahr:  oModel.getProperty("/gjahr"),
                Monat:  oModel.getProperty("/monat"),
                Zstat:  "01"
            };

            var aPayload = aItems.map(function (item) {
                var nAmt = parseFloat((item.wrbtrInput || "").replace(/,/g, "")) || 0;
                return {
                    Saknr:   item.saknr,
                    Shkzg:   item.shkzg,
                    Bschl:   item.bschl,
                    Wrbtr:   nAmt,
                    Dmbtr:   nAmt,
                    Fwbas:   nAmt,
                    Mwskz:   item.mwskz  || "",
                    Wmwst:   item.wmwst  || 0,
                    Kostl:   item.kostl  || "",
                    Werks:   item.werks  || "",
                    Prctr:   item.prctr  || "",
                    Kunnr:   "",
                    Vencode: "",
                    Sgtxt:   item.sgtxt  || "",
                    Waers:   sWaers
                };
            });

            var oODataModel = this.getView().getModel();
            if (!oODataModel) {
                MessageToast.show("OData 모델 연결 필요 — 콘솔에서 페이로드를 확인하세요.");
                console.log("[GL 전표] Payload:", JSON.stringify({ header: oHeader, items: aPayload }, null, 2));
                return;
            }

            var that = this;
            oODataModel.create("/VoucherHeaderSet", Object.assign({}, oHeader, { VoucherItemSet: aPayload }), {
                success: function (oData) {
                    var sBelnr = oData.Belnr || "";
                    var sGjahr = oData.Gjahr || "";

                    // 첨부파일 업로드 (전표번호 확정 후 즉시 시작)
                    if (sBelnr && sGjahr) {
                        that._uploadAttachments(sBelnr, sGjahr);
                    }

                    MessageBox.success(
                        "전표가 생성되었습니다.\n전표번호: " + (sBelnr || "—") + "  회계연도: " + (sGjahr || "—"),
                        { title: "전표 생성 완료" }
                    );
                    that._resetForm();
                },
                error: function (oError) {
                    var sMsg = "전표 생성 중 오류가 발생했습니다.";
                    try { sMsg = JSON.parse(oError.responseText).error.message.value || sMsg; } catch (e) {}
                    MessageBox.error(sMsg, { title: "저장 오류" });
                }
            });
        },

        // ── HR 작성자 정보 ───────────────────────────────────
        _loadHRData: function () {
            var oModel = this.getView().getModel("viewModel");
            var that   = this;

            // 1순위: Fiori Launchpad UserInfo
            var sUname = "";
            try { sUname = sap.ushell.Container.getService("UserInfo").getId(); } catch (e) {}

            // DEFAULT_USER = mock ushell → 실제 사용자 ID 아님
            if (sUname && sUname !== "DEFAULT_USER") {
                console.log("[HR] ushell Uname →", sUname);
                that._callHROData(sUname, oModel);
                return;
            }

            // 2순위: SAP 표준 엔드포인트 /sap/bc/ui2/start_up
            // → Launchpad/standalone 무관하게 현재 로그인 사용자 id 반환
            fetch("/sap/bc/ui2/start_up", { credentials: "same-origin" })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    sUname = (data.id || "").toUpperCase();
                    console.log("[HR] start_up Uname →", sUname);
                    if (sUname) {
                        that._callHROData(sUname, oModel);
                    } else {
                        oModel.setProperty("/userName", "—");
                    }
                })
                .catch(function () {
                    console.warn("[HR] start_up 조회 실패");
                    oModel.setProperty("/userName", "—");
                });
        },

        _callHROData: function (sUname, oModel) {
            var that     = this;
            var oHRModel = new ODataModel("/sap/opu/odata/sap/ZGWC3HR0001_SRV/", { json: true });
            oHRModel.read("/HRdataSet('" + sUname + "')", {
                success: function (o) {
                    console.log("[HR] 응답 →", o);
                    var sParts = [o.Empnm, o.Dept, o.Zposition].filter(Boolean);
                    oModel.setProperty("/userName",  sParts.length ? sParts.join(" · ") : sUname);
                    oModel.setProperty("/userPernr", o.Empno || "");
                },
                error: function (oErr) {
                    console.error("[HR] OData 오류 →", oErr);
                    oModel.setProperty("/userName", sUname);
                }
            });
        },

        // ── 내부 헬퍼 ────────────────────────────────────────
        _calcBalance: function () {
            var oModel  = this.getView().getModel("viewModel");
            var aItems  = oModel.getProperty("/items");
            var nDebit  = 0, nCredit = 0;

            aItems.forEach(function (item) {
                var nAmt = parseFloat((item.wrbtrInput || "").replace(/,/g, "")) || 0;
                if (item.shkzg === "S") nDebit  += nAmt;
                else                   nCredit += nAmt;
            });

            var nDiff      = Math.abs(nDebit - nCredit);
            var bHasLines  = aItems.length > 0;
            var bBalanced  = bHasLines && nDiff < 0.01 && nDebit > 0;
            var bNoAmount  = (nDebit === 0 && nCredit === 0);

            oModel.setProperty("/debitSumText",  this._fmt(nDebit));
            oModel.setProperty("/creditSumText", this._fmt(nCredit));
            oModel.setProperty("/diffText",
                (!bHasLines || bNoAmount) ? "—" : bBalanced ? "0" :
                (nDebit >= nCredit ? "+" : "-") + this._fmt(nDiff));

            if (!bHasLines || bNoAmount) {
                oModel.setProperty("/balStatusText", "라인 입력 대기");
                oModel.setProperty("/balState",      "None");
                oModel.setProperty("/balIcon",       "sap-icon://information");
            } else if (bBalanced) {
                oModel.setProperty("/balStatusText", "차대변 균형");
                oModel.setProperty("/balState",      "Success");
                oModel.setProperty("/balIcon",       "sap-icon://accept");
            } else {
                oModel.setProperty("/balStatusText", "차액 " + this._fmt(nDiff));
                oModel.setProperty("/balState",      "Error");
                oModel.setProperty("/balIcon",       "sap-icon://alert");
            }
        },

        _updateLineCount: function () {
            var oModel = this.getView().getModel("viewModel");
            var n      = oModel.getProperty("/items").length;
            oModel.setProperty("/lineCount",    n);
            oModel.setProperty("/lineCountTag", n + "개 라인");
            oModel.setProperty("/tableRowCount", Math.max(n, 1));
        },

        _fmt: function (n) {
            return Math.round(n || 0).toLocaleString("ko-KR");
        },

        _toDateStr: function (oDate) {
            return oDate.getFullYear() + "-" +
                   String(oDate.getMonth() + 1).padStart(2, "0") + "-" +
                   String(oDate.getDate()).padStart(2, "0");
        },

        // ── 첨부파일: 파일 선택 버튼 ────────────────────────
        onSelectFiles: function () {
            if (this._oFileInput) {
                this._oFileInput.value = ""; // 같은 파일 재선택 허용
                this._oFileInput.click();
            }
        },

        // ── 첨부파일: 파일 선택 이벤트 핸들러 ──────────────
        _onFilesSelected: function (oEvent) {
            var aFiles = Array.from(oEvent.target.files || []);
            if (!aFiles.length) { return; }

            var oModel       = this.getView().getModel("viewModel");
            var aAttachments = oModel.getProperty("/attachments") || [];

            aFiles.forEach(function (oFile) {
                aAttachments.push({
                    filename:    oFile.name,
                    size:        oFile.size,
                    metaText:    this._formatFileSize(oFile.size) + "  ·  " + (oFile.type || "파일"),
                    mimetype:    oFile.type || "application/octet-stream",
                    fileIcon:    this._getFileIcon(oFile.name),
                    statusText:  "대기중",
                    statusState: "None",
                    removable:   true,
                    _file:       oFile
                });
            }.bind(this));

            oModel.setProperty("/attachments", aAttachments);
            this._updateAttachCount();
        },

        // ── 첨부파일: 항목 제거 ──────────────────────────────
        onRemoveAttach: function (oEvent) {
            var oCtx  = oEvent.getSource().getBindingContext("viewModel");
            var iIdx  = parseInt(oCtx.getPath().split("/").pop(), 10);
            var oModel = this.getView().getModel("viewModel");
            var aList  = oModel.getProperty("/attachments");
            aList.splice(iIdx, 1);
            oModel.setProperty("/attachments", aList);
            this._updateAttachCount();
        },

        // ── 첨부파일: Gateway로 업로드 ──────────────────────
        _uploadAttachments: function (sBelnr, sGjahr) {
            var oModel       = this.getView().getModel("viewModel");
            var aAttachments = oModel.getProperty("/attachments") || [];
            var aPending     = aAttachments.filter(function (a) {
                return a.statusText === "대기중" && a._file;
            });
            if (!aPending.length) { return; }

            var oODataModel = this.getView().getModel();
            var that        = this;
            var iTotal      = aPending.length;
            var iDone       = 0;

            aPending.forEach(function (oAttach) {
                // 상태: 업로드중
                var iGlobalIdx = aAttachments.indexOf(oAttach);
                that._setAttachStatus(iGlobalIdx, "업로드 중", "Warning", false);

                var oReader   = new FileReader();
                oReader.onload = function (e) {
                    // data:mimetype;base64,XXXXX → base64 부분만 추출
                    var sBase64 = (e.target.result || "").split(",")[1] || "";

                    oODataModel.create("/AttachmentSet", {
                        Bukrs:    "8282",
                        Belnr:    sBelnr,
                        Gjahr:    sGjahr,
                        Seqno:    "0000",
                        Filename: oAttach.filename,
                        Mimetype: oAttach.mimetype,
                        Filesize: String(oAttach.size),
                        Filedata: sBase64
                    }, {
                        success: function () {
                            iDone++;
                            that._setAttachStatus(iGlobalIdx, "완료", "Success", false);
                            if (iDone === iTotal) {
                                MessageToast.show(iTotal + "개 첨부파일 업로드 완료 ✓");
                            }
                        },
                        error: function (oErr) {
                            iDone++;
                            var sMsg = "업로드 실패";
                            try {
                                sMsg = JSON.parse(oErr.responseText).error.message.value || sMsg;
                            } catch (x) { /* ignore */ }
                            that._setAttachStatus(iGlobalIdx, "실패", "Error", true);
                            MessageToast.show(oAttach.filename + " — " + sMsg);
                        }
                    });
                };
                oReader.readAsDataURL(oAttach._file);
            });
        },

        // ── 첨부파일: 상태 업데이트 헬퍼 ───────────────────
        _setAttachStatus: function (iIdx, sText, sState, bRemovable) {
            var oModel = this.getView().getModel("viewModel");
            var sBase  = "/attachments/" + iIdx + "/";
            oModel.setProperty(sBase + "statusText",  sText);
            oModel.setProperty(sBase + "statusState", sState);
            oModel.setProperty(sBase + "removable",   bRemovable);
        },

        // ── 첨부파일: 카운트 + 빈 상태 업데이트 ────────────
        _updateAttachCount: function () {
            var oModel = this.getView().getModel("viewModel");
            var n      = (oModel.getProperty("/attachments") || []).length;
            oModel.setProperty("/attachCountTag", n > 0 ? n + "개 파일" : "");
            oModel.setProperty("/attachEmpty",    n === 0);
        },

        // ── 첨부파일: 파일 크기 포맷 ────────────────────────
        _formatFileSize: function (nBytes) {
            if (nBytes < 1024)            { return nBytes + " B"; }
            if (nBytes < 1024 * 1024)     { return (nBytes / 1024).toFixed(1) + " KB"; }
            return (nBytes / (1024 * 1024)).toFixed(1) + " MB";
        },

        // ── 첨부파일: 확장자별 아이콘 매핑 ─────────────────
        _getFileIcon: function (sFilename) {
            var sExt  = (sFilename || "").split(".").pop().toLowerCase();
            var mIcon = {
                pdf:  "sap-icon://pdf-attachment",
                jpg:  "sap-icon://attachment-photo",
                jpeg: "sap-icon://attachment-photo",
                png:  "sap-icon://attachment-photo",
                xls:  "sap-icon://excel-attachment",
                xlsx: "sap-icon://excel-attachment",
                doc:  "sap-icon://doc-attachment",
                docx: "sap-icon://doc-attachment",
                zip:  "sap-icon://attachment-zip-file",
                txt:  "sap-icon://document-text"
            };
            return mIcon[sExt] || "sap-icon://document";
        },

        // ── 뷰 소멸 시 hidden input 정리 ────────────────────
        onExit: function () {
            if (this._oFileInput && this._oFileInput.parentNode) {
                this._oFileInput.parentNode.removeChild(this._oFileInput);
                this._oFileInput = null;
            }
        }
    });
});

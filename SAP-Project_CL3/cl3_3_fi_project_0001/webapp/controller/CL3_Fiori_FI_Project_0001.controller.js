/*
 * ═══════════════════════════════════════════════════════════════
 * 컨트롤러 : CL3_Fiori_FI_Project_0001.controller.js
 * 화면     : 재무상태표 (Balance Sheet) 조회
 * OData    : /BSdataSet
 * 주요 흐름:
 *   onSearch → _loadBS(OData 조회) → _processBS(데이터 가공)
 *     → _updateKPI / _checkBalance / _renderBarChart / _renderTreeList
 *     → (계정 클릭) onTreeItemPress → 드릴다운 팝업
 *     → (PDF/Excel 버튼) onPressPdf / onPressExcel
 * ═══════════════════════════════════════════════════════════════
 */
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/CustomListItem",
    "sap/m/HBox",
    "sap/m/VBox",
    "sap/m/Text",
    "sap/ui/core/CustomData"
], (Controller, JSONModel, Filter, FilterOperator, MessageToast, MessageBox, CustomListItem, HBox, VBox, Text, CustomData) => {
    "use strict";

    /* ══════════════════════════════════════════════════════════════
     * 모듈 레벨 — 컨트롤 팩토리 (mk 객체)
     *   SAP UI5 컨트롤을 매번 new 하지 않고 짧은 이름으로 생성하기 위한
     *   헬퍼 함수 모음입니다.
     *   - mk.cli()  : CustomListItem (클릭 불가, type:Inactive)
     *   - mk.cliA() : CustomListItem (클릭 가능, type:Active) — 계정과목 행
     *   - mk.hbox() : HBox
     *   - mk.vbox() : VBox
     *   - mk.text() : Text
     *   - mk.cd()   : CustomData (key-value 데이터 부착 — saknr, balance 저장용)
     * ══════════════════════════════════════════════════════════════ */
    const mk = {
        cli  : () => new CustomListItem({ type:"Inactive" }),
        cliA : () => new CustomListItem({ type:"Active"   }),
        hbox : (props) => new HBox(props || {}),
        vbox : (props) => new VBox(props || {}),
        text : (txt)   => new Text({ text: txt || "" }),
        cd   : (k, v)  => new CustomData({ key:k, value:v })
    };

    /* ════ 프리뷰 환경 0002 URL 설정 ════════════════════════════════
     * 0002 앱을 별도 서버(npm run start)로 실행하는 경우,
     * 실제 포트/URL을 아래에 지정하세요.
     * 예: "http://localhost:8082"
     * 비워두면 현재 URL 경로에서 자동 추정합니다.
     * ══════════════════════════════════════════════════════════════ */
    const PREVIEW_0002_BASE = "";

    return Controller.extend("fiisdata.cl33fiproject0001.controller.CL3_Fiori_FI_Project_0001", {

        /* ══════════════════════════════════════════════════════════
         * [섹션 1] 초기화
         *   - compareModel : 전기비교 테이블 데이터 모델
         *   - drillModel   : 드릴다운 팝업 데이터 모델
         *   - _setDefaultFilter: 기준일자 = 오늘, 비교연도 = 작년
         * ══════════════════════════════════════════════════════════ */
        onInit() {
            this.getView().setModel(new JSONModel({ items:[] }), "compareModel");
            this.getView().setModel(new JSONModel({
                title:"계정 전표 내역", saknr:"", txt50:"", balance:"-", items:[]
            }), "drillModel");
            this._setDefaultFilter();
        },

        /* 기준일자/비교연도 기본값 설정 (오늘날짜 / 전년도) */
        _setDefaultFilter() {
            const t  = new Date();
            const mm = String(t.getMonth()+1).padStart(2,"0");
            const dd = String(t.getDate()).padStart(2,"0");
            this.byId("dpKeyDate").setValue(`${t.getFullYear()}${mm}${dd}`);
            this.byId("inpCompYear").setValue(String(t.getFullYear()-1));
        },

        onNavBack() {
            window.history.go(-1);
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 2] 조회
         *   onSearch   : 조회 버튼 핸들러 — 입력값 검증 후 _loadBS 호출
         *   _loadBS    : OData /BSdataSet 읽기
         *                필터: Bukrs / Gjahr / Budat(LE)
         *                상위 50,000건, Select 컬럼 지정
         *   _toDate    : "yyyyMMdd" 문자열을 Date 객체(UTC 23:59:59)로 변환
         *                (OData 날짜 필터에 사용)
         * ══════════════════════════════════════════════════════════ */
        onSearch() {
            const keyDate  = this.byId("dpKeyDate").getValue();
            const bukrs    = this.byId("inpBukrs").getValue();
            const compYear = this.byId("inpCompYear").getValue();
            if (!keyDate || keyDate.length < 8) {
                MessageBox.warning("기준일자를 입력하세요.");
                return;
            }
            this._loadBS(bukrs, keyDate, compYear);
        },

        _loadBS(bukrs, keyDate, compYear) {
            const oModel = this.getOwnerComponent().getModel();
            const gjahr  = keyDate.substring(0,4);

            this.getView().setBusy(true);
            oModel.read("/BSdataSet", {
                filters: [
                    new Filter("Bukrs", FilterOperator.EQ, bukrs),
                    new Filter("Gjahr", FilterOperator.EQ, gjahr),
                    new Filter("Budat", FilterOperator.LE, this._toDate(keyDate))
                ],
                urlParameters: {
                    "$select": "Bukrs,Gjahr,Belnr,Buzei,Saknr,SaknrTxt50,FsType,FsLvl1,FsLvl2,FsSeq,FsSign,Budat,Balance,Blart,Shkzg,Dmbtr,Sgtxt",
                    "$top": "50000"
                },
                success: (oData) => {
                    this.getView().setBusy(false);
                    if (!oData.results.length) {
                        MessageToast.show("조회된 데이터가 없습니다.");
                        return;
                    }
                    this._processBS(oData.results, bukrs, compYear, keyDate);
                },
                error: (oErr) => {
                    this.getView().setBusy(false);
                    MessageBox.error("조회 실패: " + (oErr.message || "OData 오류"));
                }
            });
        },

        /* "yyyyMMdd" → Date(UTC 23:59:59) 변환 */
        _toDate(s8) {
            return new Date(Date.UTC(
                +s8.substring(0,4), +s8.substring(4,6)-1, +s8.substring(6,8), 23,59,59
            ));
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 3] 데이터 처리
         *   OData 결과를 계정과목(saknr) → 대분류(lvl1) → 자산/부채+자본 으로
         *   집계하고 화면 각 영역에 데이터를 넘겨줍니다.
         *
         *   주요 로직:
         *   1) getVal  : OData 필드 대소문자 방어 (Saknr/saknr/SAKNR 모두 처리)
         *   2) mSaknr  : 계정별 잔액 합산 + 전표 목록 저장 (드릴다운용)
         *   3) mLvl1   : 대분류별 합산 + 중분류(lvl2) + 계정목록
         *   4) 자산/부채+자본 분리: k.includes("자산") 으로 구분
         *   5) 당기순이익 보정:
         *        totalA - liab - equity ≠ 0 이면
         *        차액을 "이익잉여금" 항목으로 자본에 자동 추가
         *   6) 렌더링 호출: KPI / 균형 / 차트 / 트리
         *
         *   ※ 수정 포인트:
         *     - 자산/부채 구분 기준: k.includes("자산") && !k.includes("부채")
         *       → CDS View FsLvl1 컬럼 값과 일치해야 합니다.
         *     - 당기순이익 자동 보정을 끄려면 netIncome 블록을 주석 처리하세요.
         * ══════════════════════════════════════════════════════════ */
        _processBS(aItems, bukrs, compYear, keyDate) {
            const mSaknr = {};
            this._drillData  = {};  // 계정별 전표 목록 (드릴다운 팝업용)
            this._acctNames  = {};  // 계정별 계정명 (드릴다운 팝업용)

            // OData 대소문자 방어 함수 (Saknr, saknr, SAKNR 모두 안전하게 추출)
            const getVal = (row, key) => row[key] !== undefined ? row[key] : (row[key.toLowerCase()] !== undefined ? row[key.toLowerCase()] : row[key.toUpperCase()]);

            // ── 1단계: 계정별 잔액 합산 ──
            aItems.forEach(r => {
                const saknr  = getVal(r, "Saknr");
                const lvl1   = (getVal(r, "FsLvl1")  || "").trim();
                const lvl2   = (getVal(r, "FsLvl2")  || "").trim();
                const seq    = (getVal(r, "FsSeq")   || "").trim();

                // 대소문자 문제로 데이터가 없으면 강제로 '미분류' 처리하여 증발 방지
                const safeSaknr = saknr || "미분류계정";
                const safeLvl1  = lvl1  || "기타항목";

                if (!mSaknr[safeSaknr]) {
                    mSaknr[safeSaknr] = {
                        balance:0, fsLvl1:safeLvl1, fsLvl2:lvl2, fsSeq:seq, items:[],
                        txt50: (getVal(r, "SaknrTxt50") || getVal(r, "SaknrTxt20") || "").trim()
                    };
                }

                // CDS View의 Balance를 그대로 신뢰하여 합산 (부호 이중반전 방지)
                const rawBal = parseFloat(getVal(r, "Balance")) || 0;
                mSaknr[safeSaknr].balance += rawBal;
                mSaknr[safeSaknr].items.push(r);
            });

            // ── 2단계: 대분류(lvl1) → 중분류(lvl2) → 계정 집계 ──
            const mLvl1 = {};
            Object.entries(mSaknr).forEach(([saknr, d]) => {
                if (!mLvl1[d.fsLvl1]) mLvl1[d.fsLvl1] = { total:0, seq:d.fsSeq, lvl2s:{} };
                const safeLvl2 = d.fsLvl2 || "상세분류없음";
                if (!mLvl1[d.fsLvl1].lvl2s[safeLvl2]) mLvl1[d.fsLvl1].lvl2s[safeLvl2] = { total:0, accounts:[] };

                mLvl1[d.fsLvl1].total += d.balance;
                mLvl1[d.fsLvl1].lvl2s[safeLvl2].total += d.balance;
                mLvl1[d.fsLvl1].lvl2s[safeLvl2].accounts.push({ saknr, balance:d.balance, txt50:d.txt50||"" });

                this._drillData[saknr]  = d.items;
                this._acctNames[saknr] = d.txt50 || "";
            });

            // ── 3단계: 자산 / 부채+자본 분리 ──
            // DB에 띄어쓰기 오타가 있어도 자산으로 가도록 방어
            const mA = {}, mLE = {};
            Object.entries(mLvl1).forEach(([k,v]) => {
                if (k.includes("자산") && !k.includes("부채")) mA[k] = v;
                else mLE[k] = v;
            });

            const totalA  = Object.values(mA).reduce((s,v) => s+v.total, 0);
            const ca      = mA["유동자산"]?.total   || 0;
            const nca     = mA["비유동자산"]?.total  || 0;

            // let 선언: 당기순이익 반영을 위해 재할당 필요
            let liab    = (mLE["유동부채"]?.total  || 0) + (mLE["비유동부채"]?.total || 0);
            let equity  = mLE["자본"]?.total        || 0;

            // ── 4단계: 대차 차액 = 당기순이익 → 자본(이익잉여금)에 자동 반영 ──
            // 결산 전 데이터에서 자산 ≠ 부채+자본 인 경우, 차액을 이익잉여금으로 보정
            const netIncome = totalA - liab - equity;
            if (netIncome !== 0) {
                if (!mLE["자본"]) mLE["자본"] = { total: 0, seq: "99", lvl2s: {} };
                if (!mLE["자본"].lvl2s["이익잉여금"]) mLE["자본"].lvl2s["이익잉여금"] = { total: 0, accounts: [] };

                mLE["자본"].total += netIncome;
                mLE["자본"].lvl2s["이익잉여금"].total += netIncome;
                mLE["자본"].lvl2s["이익잉여금"].accounts.push({
                    saknr: "당기순이익(미처분)",
                    balance: netIncome
                });

                equity += netIncome; // KPI 자본 카드 숫자도 업데이트
            }

            // 당기순이익 반영 후 최종 부채+자본 총계
            const totalLE = liab + equity;

            // ── 5단계: 화면 각 영역 업데이트 ──
            this._updateKPI(totalA, ca, nca, liab, equity);
            this._checkBalance(totalA, totalLE);

            // 차트 기간 뱃지 업데이트 (예: "2026년 1~3월 누계")
            const _yyyy = keyDate.substring(0,4);
            const _mm   = parseInt(keyDate.substring(4,6), 10);
            const periodTxt = this.byId("chartPeriodText");
            if (periodTxt) periodTxt.setText(`${_yyyy}년 1~${_mm}월 누계`);

            // 자산 구성비율 바 차트
            this._renderBarChart("listAssetChart", [
                { label:"유동자산",   value:ca,  total:totalA,  color:"#0070D2" },
                { label:"비유동자산", value:nca, total:totalA,  color:"#85B7EB" }
            ]);
            // 부채·자본 구성비율 바 차트
            this._renderBarChart("listLeChart", [
                { label:"유동부채",   value:mLE["유동부채"]?.total  ||0, total:totalLE, color:"#BB0000" },
                { label:"비유동부채", value:mLE["비유동부채"]?.total||0, total:totalLE, color:"#E8A0A0" },
                { label:"자본",       value:equity,                      total:totalLE, color:"#107E3E" }
            ]);

            // 자산 / 부채+자본 트리 렌더링
            this._renderTreeList("listAsset", "txtAssetTotal", "txtAssetTotalBot", mA,  totalA);
            this._renderTreeList("listLE",    "txtLeTotal",    "txtLeTotalBot",    mLE, totalLE);

            // PDF/Excel 내보내기를 위해 현재 데이터 스냅샷 저장
            this._bsSnapshot = { mA, mLE, totalA, liab, equity, totalLE, keyDate, bukrs };

            // 전기비교 데이터 로드 (비교연도 입력 시)
            if (compYear) this._loadCompare(bukrs, compYear, totalA, ca, nca, liab, equity, keyDate);
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 4] KPI 카드 업데이트
         *   _updateKPI   : 5개 KPI 카드 금액 + 소제목 퍼센트 설정
         *   _checkBalance: 자산=부채+자본 균형 여부 → statusBalance 뱃지 갱신
         *
         *   KPI ID 목록:
         *     kpiAsset / kpiCA / kpiNCA / kpiLiab / kpiEquity
         *     kpiAssetSubNum / kpiCASubNum / kpiNCASubNum / kpiLiabSubNum / kpiEquitySubNum
         *
         *   ※ 수정 포인트:
         *     - 퍼센트 공식을 바꾸려면 set("kpiXxxSubNum", ...) 부분을 수정하세요.
         *     - 부채비율: liab/equity*100 (자본 대비 부채)
         * ══════════════════════════════════════════════════════════ */
        _updateKPI(totalA, ca, nca, liab, equity) {
            const set = (id, val) => { const c = this.byId(id); if (c) c.setText(val); };

            // 주요 금액 설정
            set("kpiAsset",     this._fmt(totalA)  + " KRW");
            set("kpiCA",        this._fmt(ca)       + " KRW");
            set("kpiNCA",       this._fmt(nca)      + " KRW");
            set("kpiLiab",      this._fmt(liab)     + " KRW");
            set("kpiEquity",    this._fmt(equity)   + " KRW");

            // 소제목 퍼센트 설정
            set("kpiAssetSubNum",  "100%");
            set("kpiCASubNum",     (totalA > 0 ? Math.round(ca / totalA * 100) : 0) + "%");
            set("kpiNCASubNum",    (totalA > 0 ? Math.round(nca / totalA * 100) : 0) + "%");
            set("kpiLiabSubNum",   (equity > 0 ? Math.round(liab / equity * 100) : 0) + "%");
            set("kpiEquitySubNum", (totalA > 0 ? Math.round(equity / totalA * 100) : 0) + "%");
        },

        /* 대차 균형 확인 — 차이 1원 미만이면 균형으로 판정 */
        _checkBalance(totalA, totalLE) {
            const diff   = Math.abs(totalA - totalLE);
            const status = this.byId("statusBalance");
            if (!status) return;
            if (diff < 1) { status.setText("✔ 자산 = 부채+자본 균형"); status.setState("Success"); }
            else          { status.setText("⚠ 불균형 "+this._fmt(diff)+" KRW"); status.setState("Error"); }
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 5] 바 차트 렌더링
         *   _renderBarChart(listId, aSegs)
         *     listId : View XML의 List id (예: "listAssetChart")
         *     aSegs  : 세그먼트 배열 — { label, value, total, color }
         *
         *   각 세그먼트를 CustomListItem으로 생성하여 List에 추가합니다.
         *   바 채움 색상은 onAfterRendering 이벤트에서 직접 DOM에 주입합니다.
         *   (SAP UI5 VBox는 background 프로퍼티가 없으므로 DOM 직접 수정)
         *
         *   ※ 수정 포인트:
         *     - 색상 변경: _processBS에서 color 값을 수정하세요.
         *     - 항목 추가: aSegs 배열에 요소를 추가하세요.
         * ══════════════════════════════════════════════════════════ */
        _renderBarChart(listId, aSegs) {
            const oList = this.byId(listId);
            if (!oList) return;
            oList.removeAllItems();

            aSegs.forEach(seg => {
                const pct   = seg.total > 0 ? Math.round(Math.abs(seg.value)/Math.abs(seg.total)*100) : 0;
                const color = seg.color;

                const oItem = mk.cli();
                const oRow  = mk.hbox({ alignItems:"Center" });
                oRow.addStyleClass("bsBarRow");

                // 레이블
                const oLbl = mk.text(seg.label);
                oLbl.addStyleClass("bsBarLabel");
                oRow.addItem(oLbl);

                // 바 배경 (회색 100%)
                const oBg   = mk.vbox();
                oBg.addStyleClass("bsBarBg");

                // 바 채움 (퍼센트 너비, 렌더링 후 색상 주입)
                const oFill = mk.vbox({ width: pct + "%" });
                oFill.addStyleClass("bsBarFill");
                oFill.addEventDelegate({
                    onAfterRendering() {
                        const dom = oFill.getDomRef();
                        if (dom) dom.style.background = color;
                    }
                });
                oBg.addItem(oFill);
                oRow.addItem(oBg);

                // 퍼센트 숫자
                const oPct = mk.text(pct + "%");
                oPct.addStyleClass("bsBarPct");
                oRow.addItem(oPct);

                // 한국어 금액 (조/억/만)
                const oAmt = mk.text(this._fmtKo(seg.value));
                oAmt.addStyleClass("bsBarAmt");
                oRow.addItem(oAmt);

                oItem.addContent(oRow);
                oList.addItem(oItem);
            });
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 6] 트리 List 렌더링
         *   _renderTreeList(listId, headId, botId, mData, total)
         *     listId : 자산("listAsset") 또는 부채+자본("listLE") List id
         *     headId : 헤더 오른쪽 합계 Text id
         *     botId  : 하단 총계 Text id
         *     mData  : { lvl1명: { total, seq, lvl2s: { lvl2명: { total, accounts[] } } } }
         *     total  : 해당 패널 합계 금액
         *
         *   행 종류별 헬퍼:
         *     _mkRow(label, value, cssClass, saknr)
         *       - saknr 있으면 Active(클릭 가능) → onTreeItemPress 연결
         *       - cssClass: "bsLvl1Row" / "bsLvl2Row" / "bsLvl3Row"
         *     _mkSubtotal : 중분류 소계 행 (bsSubtotalRow)
         *     _mkL1Total  : 대분류 합계 행 (bsL1TotalRow)
         *     _mkSpacer   : 대분류 사이 구분 여백 (bsSpacer)
         *
         *   ※ 수정 포인트:
         *     - 로마자 접두사(Ⅰ./Ⅱ./Ⅲ.): ROMAN 객체에서 수정
         *     - 정렬 기준: sort by fsSeq (FsSeq 컬럼)
         * ══════════════════════════════════════════════════════════ */
        _renderTreeList(listId, headId, botId, mData, total) {
            const oList = this.byId(listId);
            if (!oList) {
                console.error(`[오류] XML 뷰에서 id가 '${listId}'인 sap.m.List 컨트롤을 찾을 수 없습니다!`);
                return;
            }
            oList.removeAllItems();

            const setTxt = (id, val) => { const c = this.byId(id); if (c) c.setText(val); };
            setTxt(headId, this._fmt(total) + " KRW");
            setTxt(botId,  this._fmt(total));

            // 대분류별 로마자 접두사 (수정 시 여기서만 변경)
            const ROMAN = { "유동자산":"Ⅰ.","비유동자산":"Ⅱ.","유동부채":"Ⅰ.","비유동부채":"Ⅱ.","자본":"Ⅲ." };
            const sorted = Object.entries(mData).sort((a,b) => (a[1].seq||"").localeCompare(b[1].seq||""));

            sorted.forEach(([l1Name, l1Data]) => {
                // 대분류 행 (lvl1)
                let rPrefix = ROMAN[l1Name] || "";
                oList.addItem(this._mkRow(rPrefix + " " + l1Name, l1Data.total, "bsLvl1Row", null));

                Object.entries(l1Data.lvl2s).forEach(([l2Name, l2Data]) => {
                    // 중분류 행 (lvl2)
                    oList.addItem(this._mkRow(l2Name, l2Data.total, "bsLvl2Row", null));

                    // 계정과목 행 (lvl3) — 클릭 시 드릴다운 팝업
                    l2Data.accounts
                        .sort((a,b) => a.saknr.localeCompare(b.saknr))
                        .forEach(acc => {
                            const lbl = acc.txt50 ? `${acc.saknr}  ${acc.txt50}` : acc.saknr;
                            oList.addItem(this._mkRow(lbl, acc.balance, "bsLvl3Row", acc.saknr));
                        });

                    // 중분류 소계 행
                    oList.addItem(this._mkSubtotal(l2Name+" 계", l2Data.total));
                });

                // 대분류 합계 행
                oList.addItem(this._mkL1Total(l1Name+" 합계", l1Data.total));
                // 대분류 사이 여백
                oList.addItem(this._mkSpacer());
            });
        },

        /* ── 트리 일반 행 생성 ─────────────────────────────────────
         * saknr 있으면 Active(클릭) + CustomData 부착 + onTreeItemPress 연결
         * value < 0 이면 bsNumNeg(빨강), 아니면 bsNumPos 클래스 적용
         * ────────────────────────────────────────────────────────── */
        _mkRow(label, value, cssClass, saknr) {
            const oItem = saknr ? mk.cliA() : mk.cli();
            if (saknr) oItem.addCustomData(mk.cd("saknr", saknr));
            if (value !== null) oItem.addCustomData(mk.cd("balance", String(value)));
            if (saknr) oItem.attachPress(this.onTreeItemPress.bind(this));

            const oRow = mk.hbox({ justifyContent:"SpaceBetween", alignItems:"Center" });
            oRow.addStyleClass(cssClass);

            const oLbl = mk.text(label);  oLbl.addStyleClass("bsRowLabel");
            const oNum = mk.text(this._fmt(value));
            oNum.addStyleClass("bsRowNum");
            oNum.addStyleClass(value < 0 ? "bsNumNeg" : "bsNumPos");

            oRow.addItem(oLbl);
            oRow.addItem(oNum);
            oItem.addContent(oRow);
            return oItem;
        },

        /* 중분류 소계 행 (bsSubtotalRow) */
        _mkSubtotal(label, value) {
            const oItem = mk.cli();
            const oRow  = mk.hbox({ justifyContent:"SpaceBetween", alignItems:"Center" });
            oRow.addStyleClass("bsSubtotalRow");
            const oL = mk.text(label);  oL.addStyleClass("bsSubtotalLabel");
            const oN = mk.text(this._fmt(value)); oN.addStyleClass("bsSubtotalNum");
            oRow.addItem(oL); oRow.addItem(oN);
            oItem.addContent(oRow);
            return oItem;
        },

        /* 대분류 합계 행 (bsL1TotalRow) */
        _mkL1Total(label, value) {
            const oItem = mk.cli();
            const oRow  = mk.hbox({ justifyContent:"SpaceBetween", alignItems:"Center" });
            oRow.addStyleClass("bsL1TotalRow");
            const oL = mk.text(label);  oL.addStyleClass("bsL1TotalLabel");
            const oN = mk.text(this._fmt(value)); oN.addStyleClass("bsL1TotalNum");
            oRow.addItem(oL); oRow.addItem(oN);
            oItem.addContent(oRow);
            return oItem;
        },

        /* 대분류 사이 구분 여백 행 (bsSpacer) */
        _mkSpacer() {
            const oItem = mk.cli();
            const oV = mk.vbox(); oV.addStyleClass("bsSpacer");
            oItem.addContent(oV);
            return oItem;
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 7] 드릴다운 팝업
         *   onTreeItemPress : 계정과목(lvl3) 행 클릭 시 호출
         *     - CustomData에서 saknr / balance 추출
         *     - _drillData[saknr] 에서 전표 목록 가져옴 (컨트롤러 메모리)
         *     - drillModel 업데이트 후 팝업 오픈
         *   onDrillClose    : 닫기 버튼
         *   onDrillItemPress: 팝업 테이블 행 선택 → _selectedDrillBelnr 저장
         *   onDrillBelnrPress: 전표번호 링크 클릭 → 0002 전표조회로 바로 이동
         *   onNavToDoc      : "전표조회 이동" 버튼 → 선택된 행의 전표번호로 이동
         *   _navigateToFI0002: Fiori Launchpad CrossApplicationNavigation 사용,
         *                      없으면 window.open으로 fallback
         *
         *   ※ 수정 포인트:
         *     - 이동 타겟 SemanticObject/Action: _navigateToFI0002 내 target 수정
         *     - Fallback URL: sUrl 변수 수정
         * ══════════════════════════════════════════════════════════ */
        onTreeItemPress(oEvent) {
            const oItem = oEvent.getSource();
            const saknr = oItem.data("saknr");
            if (!saknr) return;

            // HTML DOM에서 꺼내지 않고 컨트롤러 메모리(_drillData)에서 직접 참조
            const aItems = this._drillData[saknr] || [];
            const getVal = (row, key) => row[key] !== undefined ? row[key] : (row[key.toLowerCase()] !== undefined ? row[key.toLowerCase()] : row[key.toUpperCase()]);

            const dm = this.getView().getModel("drillModel");
            const txt50 = this._acctNames?.[saknr] || "";
            dm.setProperty("/title",   "계정 전표 내역");
            dm.setProperty("/saknr",   saknr);
            dm.setProperty("/txt50",   txt50);
            dm.setProperty("/balance", this._fmt(parseFloat(oItem.data("balance"))||0));
            dm.setProperty("/items",   aItems.map(r => {
                // 전기일 포맷 변환 (Date 객체 또는 문자열 모두 처리)
                const raw = getVal(r, "Budat");
                let budat = "";
                if (raw) {
                    const d = raw instanceof Date ? raw : new Date(raw);
                    if (!isNaN(d.getTime())) {
                        budat = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
                    } else {
                        budat = String(raw).substring(0,10).replace(/-/g,".");
                    }
                }
                // Shkzg: S=차변, H=대변 (ObjectStatus state도 함께 설정)
                const shkzgRaw = getVal(r, "Shkzg") || "";
                return {
                    belnr:      getVal(r, "Belnr") || "",
                    budat,
                    blart:      getVal(r, "Blart") || "",
                    shkzg:      shkzgRaw === "S" ? "차변" : shkzgRaw === "H" ? "대변" : shkzgRaw,
                    shkzgState: shkzgRaw === "S" ? "Information" : "None",
                    dmbtr:      this._fmt(Math.abs(parseFloat(getVal(r, "Dmbtr"))||0)) + " KRW",
                    sgtxt:      getVal(r, "Sgtxt") || ""
                };
            }));

            // 팝업 첫 오픈 시 byId로 참조 캐싱
            if (!this._dlg) this._dlg = this.byId("dlgDrill");
            this._dlg.open();
        },

        /* 팝업 닫기 */
        onDrillClose()       { this._dlg?.close(); },

        /* 팝업 테이블 행 선택 → 전표번호 저장 (onNavToDoc에서 사용) */
        onDrillItemPress(oEvent) {
            const oCtx = oEvent.getSource().getBindingContext("drillModel");
            if (oCtx) this._selectedDrillBelnr = oCtx.getProperty("belnr");
        },

        /* 전표번호 링크 클릭 → 해당 전표로 바로 0002 이동 */
        onDrillBelnrPress(e) {
            const sBelnr = e.getSource().getText();
            const sGjahr = this.byId("dpKeyDate").getValue() ? this.byId("dpKeyDate").getValue().substring(0, 4) : "";
            this._dlg?.close();
            this._navigateToFI0002(sBelnr, sGjahr);
        },

        /* "전표조회 이동" 버튼: 선택 행 → 첫 번째 행 순으로 전표번호 결정 */
        onNavToDoc() {
            let sBelnr = this._selectedDrillBelnr || "";
            if (!sBelnr) {
                const oTable = this.byId("tblDrill");
                const oSel   = oTable.getSelectedItem();
                if (oSel) {
                    sBelnr = oSel.getBindingContext("drillModel").getProperty("belnr");
                } else {
                    const aItems = oTable.getItems();
                    if (aItems.length > 0) sBelnr = aItems[0].getBindingContext("drillModel").getProperty("belnr");
                }
            }
            const sGjahr = this.byId("dpKeyDate").getValue() ? this.byId("dpKeyDate").getValue().substring(0, 4) : "";
            if (!sBelnr) {
                MessageToast.show("조회할 전표 데이터가 존재하지 않습니다.");
                return;
            }
            this._dlg?.close();
            this._navigateToFI0002(sBelnr, sGjahr);
        },

        /* ══════════════════════════════════════════════════════════
         * 0002 전표조회로 이동
         *   배포(Fiori Launchpad): isNavigationSupported → true
         *     → CrossApplicationNavigation.toExternal 사용
         *   프리뷰(FLP sandbox 타겟 미등록 or FLP 없음): isNavigationSupported → false
         *     → _get0002PreviewUrl()로 window.open fallback
         *
         *   ※ 수정 포인트:
         *     - 배포 SemanticObject/Action: target 객체 수정
         *     - 프리뷰 URL: 파일 상단 PREVIEW_0002_BASE 상수 수정
         * ══════════════════════════════════════════════════════════ */
        _navigateToFI0002(sBelnr, sGjahr) {
            const sHashParam = "#?Belnr=" + encodeURIComponent(sBelnr) + "&Gjahr=" + encodeURIComponent(sGjahr);

            if (sap.ushell && sap.ushell.Container) {
                const oCrossNav = sap.ushell.Container.getService("CrossApplicationNavigation");
                // isNavigationSupported: 배포 FLP → true / 프리뷰 sandbox → false
                oCrossNav.isNavigationSupported([{
                    target: { semanticObject: "CL3FIDoc", action: "display" }
                }]).done((aResults) => {
                    if (aResults[0].supported) {
                        // [배포 Fiori Launchpad] CrossApplicationNavigation으로 이동
                        oCrossNav.toExternal({
                            target: { semanticObject: "CL3FIDoc", action: "display" },
                            params: { Belnr: sBelnr, Gjahr: sGjahr }
                        });
                    } else {
                        // [프리뷰 FLP sandbox] 타겟 미등록 → window.open fallback
                        window.open(this._get0002PreviewUrl(sHashParam), "_blank");
                    }
                }).fail(() => {
                    window.open(this._get0002PreviewUrl(sHashParam), "_blank");
                });
                return;
            }

            // [FLP 없음 — 직접 실행] window.open fallback
            window.open(this._get0002PreviewUrl(sHashParam), "_blank");
        },

        /* 프리뷰 환경 0002 URL 생성
         *   1순위: PREVIEW_0002_BASE 설정값 (파일 상단 상수)
         *   2순위: 현재 URL 경로에서 0001 → 0002 치환
         *   3순위: SAP 배포 경로 fallback
         */
        _get0002PreviewUrl(sHashParam) {
            if (PREVIEW_0002_BASE) {
                return PREVIEW_0002_BASE + "/index.html" + sHashParam;
            }
            const sPath = window.location.pathname;
            if (sPath.includes("cl3_3_fi_project_0001")) {
                return window.location.origin
                    + sPath.replace("cl3_3_fi_project_0001", "cl3_3_fi_project_0002")
                    + sHashParam;
            }
            return window.location.origin
                + "/sap/bc/ui5_ui5/sap/zcl3_3_fi/index.html"
                + sHashParam;
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 8] PDF / Excel 내보내기 버튼 핸들러
         *   onPressPdf  : _buildPrintHtml()로 HTML 생성 → 새 창 open → print()
         *   onPressExcel: _buildExcelHtml()로 HTML 생성 → Blob → a.click()
         *                 실패 시 _downloadCsv() fallback
         *
         *   ※ 두 메서드 모두 _bsSnapshot 이 없으면 조회 먼저 안내
         * ══════════════════════════════════════════════════════════ */
        onPressPdf() {
            if (!this._bsSnapshot) { MessageToast.show("먼저 조회를 실행해주세요."); return; }
            const html = this._buildPrintHtml();
            const w = window.open("", "_blank", "width=1100,height=750");
            if (!w) { MessageToast.show("팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요."); return; }
            w.document.write(html);
            w.document.close();
            setTimeout(() => w.print(), 600);
        },

        onPressExcel() {
            if (!this._bsSnapshot) { MessageToast.show("먼저 조회를 실행해주세요."); return; }
            try {
                const html = this._buildExcelHtml();
                const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=UTF-8" });
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement("a");
                a.href = url;
                a.download = "재무상태표_" + this._bsSnapshot.keyDate + ".xls";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch(e) {
                // Blob 생성 실패 시 CSV로 fallback
                this._downloadCsv();
            }
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 9] 전기비교 데이터 로드
         *   _loadCompare(bukrs, compYear, currA, currCA, currNCA, currLiab, currEquity, keyDate)
         *   - 비교연도 전체(1~12월) OData 조회
         *   - FsLvl1별 잔액 합산
         *   - 전기 자본이 0이면 (자산-부채) 로 복원 (결산 전 데이터 대응)
         *   - compareModel>/items 업데이트
         *
         *   ※ 수정 포인트:
         *     - 비교 항목 추가/변경: 배열 리터럴 내 항목 추가
         *     - 증감 색상: deltaState (Success=초록, Error=빨강)
         * ══════════════════════════════════════════════════════════ */
        _loadCompare(bukrs, compYear, currA, currCA, currNCA, currLiab, currEquity, keyDate) {
            const oModel = this.getOwnerComponent().getModel();
            oModel.read("/BSdataSet", {
                filters: [
                    new Filter("Bukrs", FilterOperator.EQ, bukrs),
                    new Filter("Gjahr", FilterOperator.EQ, compYear),
                    new Filter("Budat", FilterOperator.LE, this._toDate(compYear+"1231"))
                ],
                urlParameters: { "$select":"FsLvl1,Balance" },
                success: (oData) => {
                    const g = {"유동자산":0,"비유동자산":0,"유동부채":0,"비유동부채":0,"자본":0};

                    // OData 대소문자 방어 (전기 데이터도 동일하게 처리)
                    const getVal = (row, key) => row[key] !== undefined ? row[key] : (row[key.toLowerCase()] !== undefined ? row[key.toLowerCase()] : row[key.toUpperCase()]);

                    oData.results.forEach(r => {
                        const lvl1 = (getVal(r, "FsLvl1") || "").trim();
                        const bal = parseFloat(getVal(r, "Balance")) || 0;
                        if(g[lvl1] !== undefined) {
                            g[lvl1] += bal;
                        }
                    });

                    const prevA  = g["유동자산"] + g["비유동자산"];
                    const prevL  = g["유동부채"] + g["비유동부채"];

                    // 전기도 결산 전이면 (자산-부채)로 자본 복원
                    let prevEq = g["자본"];
                    if (prevEq === 0 && prevA !== 0) {
                        prevEq = prevA - prevL;
                    }

                    // 전기비교 테이블 제목 업데이트
                    const yyyy   = keyDate.substring(0,4);
                    const mm     = keyDate.substring(4,6);
                    const titleC = this.byId("compareTitleText");
                    if (titleC) titleC.setText(`전기 대비 증감 (${compYear}.01~12월 → ${yyyy}.01~${mm}월)`);

                    // compareModel 업데이트 (5개 항목)
                    this.getView().getModel("compareModel").setProperty("/items", [
                        { label:"자산 총계",    prev:prevA,          curr:currA,      isGrp:true  },
                        { label:"  유동자산",   prev:g["유동자산"],   curr:currCA,     isGrp:false },
                        { label:"  비유동자산", prev:g["비유동자산"], curr:currNCA,    isGrp:false },
                        { label:"부채 총계",    prev:prevL,          curr:currLiab,   isGrp:true  },
                        { label:"자본 총계",    prev:prevEq,         curr:currEquity, isGrp:true  }
                    ].map(r => ({
                        label:      r.label,
                        prev:       this._fmt(r.prev),
                        curr:       this._fmt(r.curr),
                        delta:      this._fmtDelta(r.curr - r.prev),
                        deltaState: (r.curr-r.prev)>=0 ? "Success" : "Error",
                        grpClass:   r.isGrp ? "bsCompareGrp" : "",
                        labelClass: r.isGrp ? "bsCompareLabelGrp" : "bsCompareLabel"
                    })));
                },
                error: () => {} // 전기비교 실패는 조용히 무시
            });
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 10] 트리 펼치기 / 접기
         *   onExpandAll  : listAsset, listLE 모든 아이템 visible=true
         *   onCollapseAll: lvl2 / lvl3 / 소계 행만 hidden
         *                  (bsLvl1Row 와 bsL1TotalRow / bsSpacer 는 유지)
         * ══════════════════════════════════════════════════════════ */
        onExpandAll() {
            ["listAsset","listLE"].forEach(id => {
                this.byId(id)?.getItems().forEach(item => item.setVisible(true));
            });
        },

        onCollapseAll() {
            // 숨길 CSS 클래스 목록 (lvl2, lvl3, 소계)
            const HIDE = ["bsLvl2Row","bsLvl3Row","bsSubtotalRow"];
            ["listAsset","listLE"].forEach(id => {
                this.byId(id)?.getItems().forEach(item => {
                    const contents = item.getContent();
                    if (!contents || !contents.length) return;
                    const cls = (contents[0].aCustomStyleClasses || []).join(" ");
                    item.setVisible(!HIDE.some(c => cls.includes(c)));
                });
            });
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 11] 내보내기 헬퍼
         *   _buildExcelRows : 자산/부채+자본 데이터를 평탄한 행 배열로 변환
         *   _downloadCsv    : CSV Blob 생성 → 다운로드
         *   _buildPrintHtml : 인쇄용 HTML (A4 landscape 최적화)
         *                     헤더/KPI/대조표 포함
         *   _buildExcelHtml : Excel 호환 HTML (.xls 형식)
         *                     KPI 섹션 + 자산/부채+자본 2개 섹션
         *
         *   ※ 수정 포인트:
         *     - 파일명: a.download 값
         *     - 인쇄 여백: @page margin 값 (현재 8mm)
         *     - 열 너비: colgroup style="width:XX%"
         * ══════════════════════════════════════════════════════════ */
        _buildExcelRows() {
            const { mA, mLE, totalA, totalLE } = this._bsSnapshot;
            const ROMAN = { "유동자산":"Ⅰ.","비유동자산":"Ⅱ.","유동부채":"Ⅰ.","비유동부채":"Ⅱ.","자본":"Ⅲ." };
            const rows  = [];

            const addSection = (section, mData, sTotal) => {
                Object.entries(mData)
                    .sort((a,b)=>(a[1].seq||"").localeCompare(b[1].seq||""))
                    .forEach(([l1, l1Data]) => {
                        rows.push({ section, lvl1: (ROMAN[l1]||"")+" "+l1, lvl2:"", saknr:"", balance: l1Data.total });
                        Object.entries(l1Data.lvl2s).forEach(([l2, l2Data]) => {
                            rows.push({ section, lvl1: l1, lvl2: l2, saknr:"", acctName:"", balance: l2Data.total });
                            l2Data.accounts
                                .sort((a,b)=>a.saknr.localeCompare(b.saknr))
                                .forEach(acc => rows.push({ section, lvl1: l1, lvl2: l2, saknr: acc.saknr, acctName: acc.txt50||"", balance: acc.balance }));
                            rows.push({ section, lvl1: l1, lvl2: l2+" 계", saknr:"", acctName:"", balance: l2Data.total });
                        });
                        rows.push({ section, lvl1: l1+" 합계", lvl2:"", saknr:"", balance: l1Data.total });
                        rows.push({ section:"", lvl1:"", lvl2:"", saknr:"", balance: null });
                    });
                rows.push({ section, lvl1: section+" 총계", lvl2:"", saknr:"", balance: sTotal });
            };

            addSection("자산",    mA,  totalA);
            rows.push({ section:"", lvl1:"", lvl2:"", saknr:"", balance: null });
            addSection("부채·자본", mLE, totalLE);
            return rows;
        },

        /* CSV fallback 다운로드 */
        _downloadCsv() {
            const rows   = this._buildExcelRows();
            const header = "구분,대분류,중분류,계정과목번호,계정과목명,금액(KRW)\n";
            const body   = rows.map(r =>
                [r.section, r.lvl1, r.lvl2, r.saknr, r.acctName||"", r.balance != null ? r.balance : ""]
                    .map(v => '"' + String(v||"").replace(/"/g,'""') + '"').join(",")
            ).join("\n");
            const blob = new Blob(["﻿" + header + body], { type:"text/csv;charset=utf-8" });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href = url; a.download = "재무상태표_" + this._bsSnapshot.keyDate + ".csv";
            a.click(); URL.revokeObjectURL(url);
        },

        /* 인쇄용 HTML 빌드 (A4 landscape) */
        _buildPrintHtml() {
            const { mA, mLE, totalA, totalLE, keyDate, bukrs, liab, equity } = this._bsSnapshot;
            const fmt = v => { if (v==null) return ""; const n=typeof v==="number"?v:parseFloat(v)||0; return n.toLocaleString("ko-KR",{maximumFractionDigits:0}); };
            const fmtDate = s => s.substring(0,4)+"."+s.substring(4,6)+"."+s.substring(6,8);
            const ROMAN = {"유동자산":"Ⅰ.","비유동자산":"Ⅱ.","유동부채":"Ⅰ.","비유동부채":"Ⅱ.","자본":"Ⅲ."};
            const debtRatio = equity>0 ? Math.round(liab/equity*100) : 0;
            const caRatio   = totalA>0 ? Math.round((mA["유동자산"]?.total||0)/totalA*100) : 0;
            const esc = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

            const buildRows = (mData, totalLabel, total) => {
                const rows = [];
                Object.entries(mData).sort((a,b)=>(a[1].seq||"").localeCompare(b[1].seq||"")).forEach(([l1,l1d])=>{
                    rows.push({label:esc((ROMAN[l1]||"")+" "+l1), value:l1d.total, cls:"r1"});
                    Object.entries(l1d.lvl2s).forEach(([l2,l2d])=>{
                        rows.push({label:esc(l2), value:l2d.total, cls:"r2"});
                        l2d.accounts.sort((a,b)=>a.saknr.localeCompare(b.saknr)).forEach(acc=>
                            rows.push({label:esc(acc.txt50?`${acc.saknr}  ${acc.txt50}`:acc.saknr), value:acc.balance, cls:"r3"}));
                        rows.push({label:esc(l2+" 계"), value:l2d.total, cls:"rs"});
                    });
                    rows.push({label:esc(l1+" 합계"), value:l1d.total, cls:"rt"});
                    rows.push({label:"", value:null, cls:"rsp"});
                });
                rows.push({label:esc(totalLabel), value:total, cls:"rtot"});
                return rows;
            };

            const aRows = buildRows(mA,"자산 총계",totalA);
            const lRows = buildRows(mLE,"부채·자본 총계",totalLE);
            const max   = Math.max(aRows.length,lRows.length);
            let tbody = "";
            for(let i=0;i<max;i++){
                const a=aRows[i]||{label:"",value:null,cls:""};
                const l=lRows[i]||{label:"",value:null,cls:""};
                tbody+=`<tr><td class="${a.cls}">${a.label||""}</td><td class="${a.cls} n">${a.value!=null?fmt(a.value):""}</td><td class="${l.cls} dv">${l.label||""}</td><td class="${l.cls} n">${l.value!=null?fmt(l.value):""}</td></tr>\n`;
            }

            return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>재무상태표</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Malgun Gothic','Apple SD Gothic Neo',Arial,sans-serif;font-size:9pt;color:#1a1a2e;background:#fff}
.hdr{background:linear-gradient(135deg,#0057b8,#00177C);color:#fff;padding:13px 18px;display:flex;justify-content:space-between;align-items:center}
.hdr-l .t1{font-size:17pt;font-weight:700;letter-spacing:.5px}
.hdr-l .t2{font-size:8.5pt;opacity:.8;margin-top:3px}
.hdr-r{text-align:right;font-size:9pt}
.hdr-r .d1{font-size:13pt;font-weight:700}
.hdr-r .d2{font-size:8pt;opacity:.75;margin-top:2px}
.kpi{display:flex;background:#f0f6ff;border-bottom:2px solid #0070D2}
.kpi-c{flex:1;padding:7px 12px;border-right:1px solid #d0e4f7}
.kpi-c:last-child{border-right:none}
.kpi-l{font-size:7pt;color:#6A6D70;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
.kpi-v{font-size:11pt;font-weight:700}
.kpi-v.bl{color:#0057b8} .kpi-v.rd{color:#BB0000} .kpi-v.gn{color:#107E3E}
.kpi-u{font-size:7pt;font-weight:400;color:#6A6D70;margin-left:2px}
table{width:100%;border-collapse:collapse;table-layout:fixed}
thead th{background:#0070D2;color:#fff;padding:6px 8px;font-size:9pt;text-align:left;font-weight:600}
thead th.n{text-align:right} thead th.dv{border-left:3px solid rgba(255,255,255,.4)}
td{padding:2.5px 8px;vertical-align:middle;font-size:8.5pt;border-bottom:1px solid #f0f0f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
td.n{text-align:right;font-family:Consolas,'Lucida Console',monospace;white-space:nowrap}
td.dv{border-left:2px solid #C0D0F0}
.r1{font-weight:700;background:#E8F0FF;color:#00177C;border-top:1px solid #C0D0F0}
.r1.n{color:#00177C}
.r2{padding-left:16px!important;background:#FAFBFF;color:#32363A}
.r3{padding-left:28px!important;color:#555;font-size:8pt}
.rs{padding-left:16px!important;font-weight:600;background:#F0F4F8;border-top:1px solid #D9D9D9;color:#32363A}
.rt{font-weight:700;background:#ddeaf7;color:#00177C;border-top:2px solid #0070D2}
.rt.n{color:#0070D2}
.rsp td{height:6px;background:#fff;border:none}
.rtot{font-weight:700;background:#00177C;color:#fff;font-size:9.5pt}
.rtot.n{color:#fff}
.ftxt{padding:5px 10px;font-size:7.5pt;color:#999;border-top:1px solid #e0e0e0;display:flex;justify-content:space-between}
@media print{@page{size:A4 landscape;margin:8mm}.hdr,.kpi,.rtot,.r1{-webkit-print-color-adjust:exact;print-color-adjust:exact}button{display:none}}
</style></head><body>

<div class="hdr">
  <div class="hdr-l">
    <div class="t1">재무상태표 <span style="font-size:11pt;font-weight:300;opacity:.75">Balance Sheet</span></div>
    <div class="t2">HubRoad Co. &nbsp;|&nbsp; Company Code: ${bukrs} &nbsp;|&nbsp; 단위: KRW</div>
  </div>
  <div class="hdr-r">
    <div style="font-size:8pt;opacity:.75">기준일자</div>
    <div class="d1">${fmtDate(keyDate)}</div>
    <div class="d2">출력: ${new Date().toLocaleDateString("ko-KR")}</div>
  </div>
</div>

<div class="kpi">
  <div class="kpi-c"><div class="kpi-l">자산 총계</div><div class="kpi-v bl">${fmt(totalA)}<span class="kpi-u">KRW</span></div></div>
  <div class="kpi-c"><div class="kpi-l">부채 총계</div><div class="kpi-v rd">${fmt(liab)}<span class="kpi-u">KRW</span></div></div>
  <div class="kpi-c"><div class="kpi-l">자본 총계</div><div class="kpi-v gn">${fmt(equity)}<span class="kpi-u">KRW</span></div></div>
  <div class="kpi-c"><div class="kpi-l">부채비율</div><div class="kpi-v rd">${debtRatio}%</div></div>
  <div class="kpi-c"><div class="kpi-l">유동자산 비율</div><div class="kpi-v bl">${caRatio}%</div></div>
</div>

<table>
<colgroup><col style="width:33%"><col style="width:17%"><col style="width:33%"><col style="width:17%"></colgroup>
<thead><tr>
  <th>자산 (Assets)</th><th class="n">금액 (KRW)</th>
  <th class="dv">부채·자본 (Liabilities &amp; Equity)</th><th class="n">금액 (KRW)</th>
</tr></thead>
<tbody>${tbody}</tbody>
</table>
<div class="ftxt"><span>ZI_FI_BS · BSdataSet · ZCDS_C3_FI_0001</span><span>${new Date().toLocaleString("ko-KR")}</span></div>
</body></html>`;
        },

        /* Excel 호환 HTML 빌드 (.xls) */
        _buildExcelHtml() {
            const { mA, mLE, totalA, totalLE, keyDate, bukrs, liab, equity } = this._bsSnapshot;
            const fmt = v => { if(v==null) return ""; const n=typeof v==="number"?v:parseFloat(v)||0; return n.toLocaleString("ko-KR",{maximumFractionDigits:0}); };
            const fmtDate = s => s.substring(0,4)+"."+s.substring(4,6)+"."+s.substring(6,8);
            const ROMAN = {"유동자산":"Ⅰ.","비유동자산":"Ⅱ.","유동부채":"Ⅰ.","비유동부채":"Ⅱ.","자본":"Ⅲ."};
            const debtRatio = equity>0?Math.round(liab/equity*100):0;
            const caRatio   = totalA>0?Math.round((mA["유동자산"]?.total||0)/totalA*100):0;
            const esc = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
            const N = "text-align:right;font-family:Consolas,monospace;white-space:nowrap;";
            const PAD = "padding:4px 10px;";

            // 행 빌더 함수 (각 레벨별 인라인 스타일 적용)
            const SEC = (t,c) => `<tr><td colspan="2" style="background:${c};color:#fff;font-weight:700;font-size:11pt;${PAD}padding-top:8px;padding-bottom:8px;">${esc(t)}</td></tr>`;
            const R1  = (l,v) => `<tr><td style="background:#E8F0FF;color:#00177C;font-weight:700;${PAD}border-top:1px solid #C0D0F0;">${esc(l)}</td><td style="background:#E8F0FF;color:#00177C;font-weight:700;${N}${PAD}border-top:1px solid #C0D0F0;">${fmt(v)}</td></tr>`;
            const R2  = (l,v) => `<tr><td style="background:#FAFBFF;${PAD}padding-left:22px;">${esc(l)}</td><td style="background:#FAFBFF;${N}${PAD}">${fmt(v)}</td></tr>`;
            const R3  = (l,v) => `<tr><td style="font-size:8.5pt;color:#555;${PAD}padding-left:38px;">${esc(l)}</td><td style="font-size:8.5pt;color:#555;${N}${PAD}">${fmt(v)}</td></tr>`;
            const RS  = (l,v) => `<tr><td style="background:#F0F4F8;font-weight:600;${PAD}padding-left:22px;border-top:1px solid #D9D9D9;">${esc(l)}</td><td style="background:#F0F4F8;font-weight:600;${N}${PAD}border-top:1px solid #D9D9D9;">${fmt(v)}</td></tr>`;
            const RT  = (l,v) => `<tr><td style="background:#ddeaf7;color:#00177C;font-weight:700;${PAD}border-top:2px solid #0070D2;">${esc(l)}</td><td style="background:#ddeaf7;color:#0070D2;font-weight:700;${N}${PAD}border-top:2px solid #0070D2;">${fmt(v)}</td></tr>`;
            const TOT = (l,v) => `<tr><td style="background:#00177C;color:#fff;font-weight:700;font-size:10pt;${PAD}">${esc(l)}</td><td style="background:#00177C;color:#fff;font-weight:700;font-size:10pt;${N}${PAD}">${fmt(v)}</td></tr>`;
            const SP  = () => `<tr><td colspan="2" style="height:9px;background:#fff;"> </td></tr>`;

            const buildSection = (mData,secLabel,secColor,sTotal) => {
                let r = SEC(secLabel,secColor);
                Object.entries(mData).sort((a,b)=>(a[1].seq||"").localeCompare(b[1].seq||"")).forEach(([l1,l1d])=>{
                    r += R1((ROMAN[l1]||"")+" "+l1, l1d.total);
                    Object.entries(l1d.lvl2s).forEach(([l2,l2d])=>{
                        r += R2(l2, l2d.total);
                        l2d.accounts.sort((a,b)=>a.saknr.localeCompare(b.saknr)).forEach(acc=>
                            r += R3(acc.txt50?`${acc.saknr}  ${acc.txt50}`:acc.saknr, acc.balance));
                        r += RS(l2+" 계", l2d.total);
                    });
                    r += RT(l1+" 합계", l1d.total);
                    r += SP();
                });
                r += TOT(secLabel+" 총계", sTotal);
                r += SP();
                return r;
            };

            return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
<style>
  table{border-collapse:collapse;font-family:'Malgun Gothic',Arial,sans-serif;font-size:9pt;width:700px}
  td{border:none;vertical-align:middle}
</style>
</head><body>
<table>
  <col style="width:70%"/><col style="width:30%"/>

  <tr><td colspan="2" style="background:#00177C;color:#fff;font-size:18pt;font-weight:700;padding:13px 16px;letter-spacing:.5px;">재무상태표 <span style="font-size:11pt;font-weight:300;opacity:.8">Balance Sheet</span></td></tr>
  <tr><td colspan="2" style="background:#0070D2;color:#fff;font-size:9pt;padding:6px 16px;">HubRoad Co. &nbsp;|&nbsp; Company Code: ${bukrs} &nbsp;|&nbsp; 기준일자: ${fmtDate(keyDate)} &nbsp;|&nbsp; 단위: KRW</td></tr>
  <tr><td colspan="2" style="height:10px;"> </td></tr>

  <tr>
    <td colspan="2" style="background:#E8F0FF;color:#00177C;font-weight:700;font-size:9pt;padding:5px 10px;border-bottom:2px solid #0070D2;letter-spacing:.3px;">
      핵심 지표 (KPI Summary)
    </td>
  </tr>
  <tr>
    <td style="padding:3px 10px;font-size:8pt;color:#6A6D70;font-weight:600;">자산 총계</td>
    <td style="padding:3px 10px;font-size:8pt;color:#6A6D70;font-weight:600;text-align:right;">부채 총계</td>
  </tr>
  <tr>
    <td style="padding:2px 10px 6px;font-size:13pt;font-weight:700;color:#0057b8;">${fmt(totalA)} KRW</td>
    <td style="padding:2px 10px 6px;font-size:13pt;font-weight:700;color:#BB0000;text-align:right;">${fmt(liab)} KRW</td>
  </tr>
  <tr>
    <td style="padding:3px 10px;font-size:8pt;color:#6A6D70;font-weight:600;">자본 총계</td>
    <td style="padding:3px 10px;font-size:8pt;color:#6A6D70;font-weight:600;text-align:right;">부채비율 &nbsp;|&nbsp; 유동자산 비율</td>
  </tr>
  <tr>
    <td style="padding:2px 10px 8px;font-size:13pt;font-weight:700;color:#107E3E;">${fmt(equity)} KRW</td>
    <td style="padding:2px 10px 8px;font-size:11pt;font-weight:700;color:#BB0000;text-align:right;">${debtRatio}% &nbsp;|&nbsp; <span style="color:#0057b8">${caRatio}%</span></td>
  </tr>

  <tr><td colspan="2" style="height:12px;"> </td></tr>
  <tr>
    <td style="background:#0070D2;color:#fff;font-weight:600;font-size:10pt;padding:7px 10px;">항목</td>
    <td style="background:#0070D2;color:#fff;font-weight:600;font-size:10pt;padding:7px 10px;text-align:right;">금액 (KRW)</td>
  </tr>

  ${buildSection(mA,   "자산 (Assets)",                    "#003D82", totalA)}
  ${buildSection(mLE,  "부채·자본 (Liabilities &amp; Equity)", "#1a6e3c", totalLE)}

  <tr><td colspan="2" style="border-top:1px solid #D9D9D9;padding:5px 10px;color:#999;font-size:7.5pt;">
    ZI_FI_BS · BSdataSet &nbsp;|&nbsp; 출력: ${new Date().toLocaleString("ko-KR")}
  </td></tr>
</table>
</body></html>`;
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 12] 포맷팅 유틸리티
         *   _fmt    : 숫자 → 천 단위 쉼표 (소수점 없음)
         *             예: 1234567 → "1,234,567"
         *   _fmtKo  : 숫자 → 한국어 단위 (조/억/만원)
         *             예: 38500000 → "3억 8,500만원"
         *   _fmtDelta: 증감 표시 (+ 또는 - 접두사 + 천 단위)
         *             예: 1000 → "+1,000", -500 → "-500"
         * ══════════════════════════════════════════════════════════ */
        _fmt(v) {
            const n = typeof v==="number" ? v : parseFloat(v)||0;
            return n.toLocaleString("ko-KR", { maximumFractionDigits:0 });
        },

        /* 한국어 단위 변환 (조/억/만) */
        _fmtKo(v) {
            const n   = typeof v==="number" ? v : parseFloat(v)||0;
            const neg = n < 0;
            const abs = Math.abs(n);
            if (abs === 0) return "0원";

            const JO  = 1_000_000_000_000; // 조
            const EOK = 100_000_000;        // 억
            const MAN = 10_000;             // 만

            const jo   = Math.floor(abs / JO);
            const eok  = Math.floor((abs % JO)  / EOK);
            const man  = Math.floor((abs % EOK)  / MAN);
            const chun = Math.floor(man / 1000);
            const rem  = man % 1000;

            let s = "";
            if (jo  > 0) s += jo  + "조";
            if (eok > 0) s += eok + "억";
            if (man > 0) {
                if      (chun > 0 && rem > 0) s += chun + "천" + rem + "만";
                else if (chun > 0)            s += chun + "천만";
                else                          s += rem  + "만";
            }
            if (!s) s = abs.toLocaleString("ko-KR");
            return (neg ? "-" : "") + s + "원";
        },

        /* 증감 표시 (+/-) */
        _fmtDelta(v) {
            const n = typeof v==="number" ? v : parseFloat(v)||0;
            return (n>=0?"+":"-") + Math.abs(n).toLocaleString("ko-KR",{ maximumFractionDigits:0 });
        }

    });
});

/*
 * ═══════════════════════════════════════════════════════════════
 * 컨트롤러 : cl3_3_fi_project_0003.controller.js
 * 화면     : 손익계산서 (Income Statement) 조회
 * OData    : /ISdataSet  (ZCDS_C3_FI_0002_CDS)
 * 주요 흐름:
 *   onSearch → _loadIS(OData 조회) → _processIS(데이터 가공)
 *     → _updateKPI / _renderISTree / _renderAllCharts
 *     → (계정 클릭) onISItemPress → 드릴다운 팝업
 *     → (PDF/Excel 버튼) onPressPdf / onPressExcel
 *
 * IS 분류 키(IS_CAT): CDS View의 FsLvl1 값과 반드시 일치해야 합니다.
 *   필드명이 다를 경우 IS_CAT 상수를 수정하거나 CDS View를 보정하세요.
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
    "sap/ui/core/CustomData",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem"
], (Controller, JSONModel, Filter, FilterOperator, MessageToast, MessageBox, CustomListItem, HBox, VBox, Text, CustomData, SelectDialog, StandardListItem) => {
    "use strict";

    /* ══════════════════════════════════════════════════════════════
     * 모듈 레벨 — 컨트롤 팩토리 (mk 객체)  ← 0001과 동일 패턴
     * ══════════════════════════════════════════════════════════════ */
    const mk = {
        cli  : () => new CustomListItem({ type:"Inactive" }),
        cliA : () => new CustomListItem({ type:"Active"   }),
        hbox : (p) => new HBox(p || {}),
        vbox : (p) => new VBox(p || {}),
        text : (t) => new Text({ text: t || "" }),
        cd   : (k,v) => new CustomData({ key:k, value:v })
    };

    /* ══════════════════════════════════════════════════════════════
     * IS 손익 계층 분류 키 (CDS FsLvl1 값에 맞게 조정)
     *   각 배열에 FsLvl1 컬럼 값(부분 일치)을 등록하세요.
     *   예: CDS View에서 FsLvl1 = "매출원가"  → cogs 분류
     * ══════════════════════════════════════════════════════════════ */
    const IS_CAT = {
        revenue : ["매출액", "영업수익", "매출수익", "제품매출", "상품매출", "서비스매출", "용역매출"],
        cogs    : ["매출원가", "제조원가", "상품원가", "제품원가", "원재료", "재료비", "노무비", "제조비"],
        sga     : ["판매비및관리비", "판관비", "판매비", "관리비", "영업비용", "인건비", "급여", "복리후생", "감가상각"],
        nonop   : ["영업외손익", "영업외수익", "영업외비용", "기타영업외", "법인세", "이자비용", "이자수익", "금융비용", "금융수익", "기타수익", "기타비용", "지분법", "세전이익"]
    };

    /* ════ 프리뷰 환경 0002 URL 설정 ════════════════════════════════
     * 0002 앱을 별도 서버(npm run start)로 실행하는 경우,
     * 실제 포트/URL을 아래에 지정하세요.
     * 예: "http://localhost:8082"
     * 비워두면 현재 URL 경로에서 자동 추정합니다.
     * ══════════════════════════════════════════════════════════════ */
    const PREVIEW_0002_BASE = "";

    /* IS 항목의 카테고리 반환 — 없으면 "other" */
    const classifyLvl1 = (name) => {
        for (const [cat, kws] of Object.entries(IS_CAT)) {
            if (kws.some(kw => name.includes(kw))) return cat;
        }
        return "other";
    };

    /* 손익센터 코드 → 친숙한 명칭 매핑 (추가 플랜트는 여기에 등록) */
    const PRCTR_NAME = {
        "PC1000": "오산 플랜트",
        "PC2000": "파주 플랜트"
    };
    const prctrLabel = (code) => {
        if (!code || code === "-" || code === "기타") return code || "-";
        const name = PRCTR_NAME[code];
        return name ? name + " (" + code + ")" : code;
    };

    /* Chart.js 색상 팔레트 */
    const COLORS = {
        blue  : "#185FA5",
        green : "#3B6D11",
        red   : "#993C1D",
        amber : "#BA7517",
        light : "#85B7EB",
        muted : ["#993C1D","#D85A30","#F0997B","#444441","#888780","#BA7517","#C9A227"]
    };

    return Controller.extend("zcl3fi.cl33fiproject0003.controller.cl3_3_fi_project_0003", {

        /* ══════════════════════════════════════════════════════════
         * [섹션 1] 초기화
         * ══════════════════════════════════════════════════════════ */
        onInit() {
            this.getView().setModel(new JSONModel({
                title:"계정 전표 내역", saknr:"", txt50:"", balance:"-", items:[]
            }), "drillModel");
            this._setDefaultFilter();
        },

        _setDefaultFilter() {
            const t = new Date();
            this.byId("inpGjahr").setValue(String(t.getFullYear()));
            this.byId("selMonatFrom").setSelectedKey("01");
            this.byId("selMonatTo").setSelectedKey(String(t.getMonth() + 1).padStart(2, "0"));
        },

        onNavBack() {
            window.history.go(-1);
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 2] 조회
         *   onSearch  : 입력값 검증 후 _loadIS 호출
         *   _loadIS   : OData /ISdataSet 읽기
         *               필터: Bukrs / Gjahr / Monat(GE/LE) / Prctr(옵션)
         *               $top 50,000, $select 컬럼 명시
         * ══════════════════════════════════════════════════════════ */
        onSearch() {
            const gjahr = (this.byId("inpGjahr").getValue() || "").trim();
            const from  = this.byId("selMonatFrom").getSelectedKey();
            const to    = this.byId("selMonatTo").getSelectedKey();
            const prctr = (this.byId("inpPrctr").getValue() || "").trim();
            const bukrs =  this.byId("inpBukrs").getValue();

            if (!gjahr || gjahr.length !== 4) {
                MessageBox.warning("회계연도 4자리를 입력하세요."); return;
            }
            if (parseInt(from, 10) > parseInt(to, 10)) {
                MessageBox.warning("시작월이 종료월보다 클 수 없습니다."); return;
            }
            this._loadIS(bukrs, gjahr, from, to, prctr);
        },

        _loadIS(bukrs, gjahr, monatFrom, monatTo, prctr) {
            const oModel = this.getOwnerComponent().getModel();
            this.getView().setBusy(true);

            const aFilters = [
                new Filter("Bukrs", FilterOperator.EQ, bukrs),
                new Filter("Gjahr", FilterOperator.EQ, gjahr),
                new Filter("Monat", FilterOperator.GE, monatFrom),
                new Filter("Monat", FilterOperator.LE, monatTo)
            ];
            if (prctr) aFilters.push(new Filter("Prctr", FilterOperator.EQ, prctr));

            oModel.read("/ISdataSet", {
                filters: aFilters,
                urlParameters: {
                    "$select": "Bukrs,Gjahr,Monat,Belnr,Buzei,Saknr,SaknrTxt20,SaknrTxt50,FsLvl1,FsLvl2,FsSeq,FsSign,Prctr,Budat,Amount,Waers",
                    "$top"   : "50000"
                },
                success: (oData) => {
                    this.getView().setBusy(false);
                    if (!oData.results.length) {
                        MessageToast.show("조회된 데이터가 없습니다."); return;
                    }
                    this._processIS(oData.results, bukrs, gjahr, monatFrom, monatTo, prctr);
                },
                error: (oErr) => {
                    this.getView().setBusy(false);
                    MessageBox.error("조회 실패: " + (oErr.message || "OData 오류"));
                }
            });
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 3] 데이터 처리
         *   OData 결과 → 계정(Saknr) → 대분류(FsLvl1) → 중분류(FsLvl2) 집계
         *   IS 분류(IS_CAT)에 따라 revenue/cogs/sga/nonop 산출
         *   파생값 계산: grossProfit / opIncome / netIncome
         *
         *   ※ 부호 규칙 (Balance 부호):
         *     CDS View에서 Balance는 절대값으로 제공된다고 가정.
         *     즉, 매출액·원가·판관비 모두 양수.
         *     revenue가 음수로 오는 경우 IS_CAT.revenue 항목 부호를 반전하세요.
         * ══════════════════════════════════════════════════════════ */
        _processIS(aItems, bukrs, gjahr, monatFrom, monatTo, prctr) {
            /* OData 필드 대소문자 방어 (Saknr / saknr / SAKNR 모두 처리) */
            const G = (row, k) =>
                row[k] !== undefined ? row[k] :
                row[k.toLowerCase()] !== undefined ? row[k.toLowerCase()] :
                (row[k.toUpperCase()] || "");

            /* ─ 1단계: 계정별 잔액 합산 ─ */
            const mSaknr = {};
            this._drillData = {};
            this._acctNames = {};

            aItems.forEach(r => {
                const saknr = G(r, "Saknr") || "UNKNOWN";
                const lvl1  = (G(r, "FsLvl1") || "기타항목").trim();
                const lvl2  = (G(r, "FsLvl2") || "미분류").trim();
                const seq   = (G(r, "FsSeq")  || "99").trim();

                if (!mSaknr[saknr]) {
                    mSaknr[saknr] = {
                        balance: 0, fsLvl1: lvl1, fsLvl2: lvl2, fsSeq: seq, items: [],
                        txt20: (G(r, "SaknrTxt20") || "").trim(),
                        txt50: (G(r, "SaknrTxt50") || G(r, "SaknrTxt20") || "").trim()
                    };
                }
                mSaknr[saknr].balance += parseFloat(G(r, "Amount")) || 0;
                mSaknr[saknr].items.push(r);
            });

            /* ─ 2단계: FsLvl1 → FsLvl2 → 계정 집계 ─ */
            const mLvl1 = {};
            Object.entries(mSaknr).forEach(([saknr, d]) => {
                if (!mLvl1[d.fsLvl1]) mLvl1[d.fsLvl1] = { total: 0, seq: d.fsSeq, lvl2s: {} };
                if (!mLvl1[d.fsLvl1].lvl2s[d.fsLvl2]) mLvl1[d.fsLvl1].lvl2s[d.fsLvl2] = { total: 0, accounts: [] };

                mLvl1[d.fsLvl1].total += d.balance;
                mLvl1[d.fsLvl1].lvl2s[d.fsLvl2].total += d.balance;
                mLvl1[d.fsLvl1].lvl2s[d.fsLvl2].accounts.push({
                    saknr, balance: d.balance, txt50: d.txt50 || d.txt20 || ""
                });
                this._drillData[saknr] = d.items;
                this._acctNames[saknr] = d.txt50 || d.txt20 || "";
            });

            /* ─ 3단계: IS 카테고리별 집계 ─ */
            let revenue = 0, cogs = 0, sga = 0, nonop = 0;
            Object.entries(mLvl1).forEach(([k, v]) => {
                const cat = classifyLvl1(k);
                if      (cat === "revenue") revenue += v.total;
                else if (cat === "cogs")    cogs    += v.total;
                else if (cat === "sga")     sga     += v.total;
                else if (cat === "nonop")   nonop   += v.total;
            });

            /* IS_CAT 미매칭 경고 (콘솔에 실제 FsLvl1 값 출력) */
            if (revenue === 0 && cogs === 0 && sga === 0 && nonop === 0) {
                const keys = Object.keys(mLvl1).join(", ");
                console.warn("[IS] IS_CAT 분류 실패 — 실제 FsLvl1 값: " + keys);
                MessageToast.show("IS 항목 분류 키 미매칭 — 콘솔(F12)에서 실제 FsLvl1 값 확인 후 IS_CAT 수정 필요");
            }

            /* ─ 손익센터 필터 적용 시 매출원가 0원 진단 ─────────────
             *  원인: SAP FI에서 매출원가(COGS)는 출고 전기 시 손익센터 없이
             *  원가 계정에 전기되거나, 다른 손익센터에 할당되는 경우가 많음.
             *  → 해당 손익센터에 직접 귀속된 원가 데이터가 없으면 정상적으로 0원.
             * ─────────────────────────────────────────────────────── */
            if (prctr && cogs === 0) {
                const allPrctrs = [...new Set(aItems.map(r => (G(r, "Prctr") || "(없음)").trim()))];
                const cogsRowCount = aItems.filter(r => classifyLvl1((G(r, "FsLvl1") || "").trim()) === "cogs").length;
                console.warn("[IS 진단] Prctr 필터:", prctr);
                console.warn("[IS 진단] 전체 조회 결과의 Prctr 분포:", allPrctrs.join(", "));
                console.warn("[IS 진단] 매출원가(COGS) 분류 행 수:", cogsRowCount,
                    cogsRowCount ? "→ FsLvl1 키워드 불일치 가능성 (IS_CAT.cogs 확인)" : "→ 해당 손익센터에 원가 데이터 없음 (정상일 수 있음)");
                MessageToast.show(
                    cogsRowCount === 0
                        ? "손익센터 '" + prctrLabel(prctr) + "'에 매출원가 데이터가 없습니다. 해당 손익센터에 직접 전기된 원가가 없는 경우 정상입니다."
                        : "매출원가 행이 있으나 집계 실패 — F12 콘솔에서 IS 진단 결과를 확인하세요.",
                    { duration: 7000 }
                );
            }

            /* ─ 4단계: 파생 손익 계산 ─ */
            const grossProfit = revenue - cogs;
            const opIncome    = grossProfit - sga;
            const netIncome   = opIncome - nonop;

            /* ─ 5단계: 상태 배지 (영업이익이 양수이면 '흑자') ─ */
            const statusCtrl = this.byId("isStatusText");
            if (statusCtrl) {
                if (netIncome >= 0) { statusCtrl.setText("✔ 당기순이익 " + this._fmt(netIncome)); }
                else                { statusCtrl.setText("▼ 당기순손실 " + this._fmt(Math.abs(netIncome))); }
            }

            /* 스냅샷 저장 (PDF/Excel 내보내기용) */
            this._isSnapshot = { mLvl1, revenue, cogs, sga, nonop, grossProfit, opIncome, netIncome, bukrs, gjahr, monatFrom, monatTo };

            /* ─ 6단계: UI 업데이트 ─ */
            this._updateKPI(revenue, cogs, grossProfit, opIncome, netIncome);
            this._renderISTree(mLvl1, grossProfit, opIncome, netIncome);

            /* ─ 7단계: 차트 데이터 빌드 + 렌더링 ─ */
            const monatRange  = this._buildMonatRange(monatFrom, monatTo);
            const monthlyData = this._buildMonthlyData(aItems, G, monatRange);
            const prctrData   = this._buildPrctrData(aItems, G, monatRange);
            this._renderAllCharts({
                monthlyData, prctrData,
                revenue, cogs, grossProfit, sga, opIncome, nonop, netIncome, mLvl1
            });
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 4] KPI 카드 업데이트
         * ══════════════════════════════════════════════════════════ */
        _updateKPI(revenue, cogs, grossProfit, opIncome, netIncome) {
            const set = (id, v) => { const c = this.byId(id); if (c) c.setText(v); };
            const pct = (n, d) => d > 0 ? (Math.round(n / d * 1000) / 10) + "%" : "-";

            set("kpiRevenue",     this._fmt(revenue)     + " KRW");
            set("kpiCogs",        this._fmt(cogs)        + " KRW");
            set("kpiGrossProfit", this._fmt(grossProfit) + " KRW");
            set("kpiOpIncome",    this._fmt(opIncome)    + " KRW");
            set("kpiNetIncome",   this._fmt(netIncome)   + " KRW");
            set("kpiGpMargin",    pct(grossProfit, revenue));
            set("kpiOpMargin",    pct(opIncome,    revenue));
            set("kpiNpMargin",    pct(netIncome,   revenue));
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 5] IS 계층 트리 렌더링 (접이식 2-컬럼)
         *   좌: 수익(revenue) | 우: 비용·손익(cogs/sga/nonop)
         *   ▶/▼ 클릭으로 항목 펼침/접기
         * ══════════════════════════════════════════════════════════ */
        _renderISTree(mLvl1, grossProfit, opIncome, netIncome) {
            const setTxt = (id, v) => { const c = this.byId(id); if (c) c.setText(v); };
            setTxt("txtNetIncomeBot", this._fmt(netIncome));

            const sorted = Object.entries(mLvl1)
                .sort((a, b) => (a[1].seq || "").localeCompare(b[1].seq || ""));

            const leftGroups  = sorted.filter(([name]) => classifyLvl1(name) === "revenue");
            const rightGroups = sorted.filter(([name]) => classifyLvl1(name) !== "revenue");

            if (!this._treeExpanded) this._treeExpanded = {};
            this._treeState = { mLvl1, grossProfit, opIncome, netIncome };

            this._fillTreeSide("listISLeft",  leftGroups,  { grossProfit, opIncome, netIncome }, "left");
            this._fillTreeSide("listISRight", rightGroups, { grossProfit, opIncome, netIncome }, "right");
        },

        _fillTreeSide(listId, groups, { grossProfit, opIncome, netIncome }, side) {
            const oList = this.byId(listId);
            if (!oList) return;
            oList.removeAllItems();

            let cogsInserted = false, sgaInserted = false;

            groups.forEach(([l1Name, l1Data]) => {
                const cat        = classifyLvl1(l1Name);
                const isExpanded = !!this._treeExpanded[l1Name];

                oList.addItem(this._mkToggleLvl1(l1Name, l1Data.total, cat, isExpanded));

                Object.entries(l1Data.lvl2s).forEach(([l2Name, l2Data]) => {
                    const l2Item = this._mkRow(l2Name, l2Data.total, "bsLvl2Row", null);
                    l2Item.setVisible(isExpanded);
                    oList.addItem(l2Item);

                    l2Data.accounts.sort((a, b) => a.saknr.localeCompare(b.saknr)).forEach(acc => {
                        const lbl     = acc.txt50 ? `${acc.saknr}  ${acc.txt50}` : acc.saknr;
                        const accItem = this._mkRow(lbl, acc.balance, "bsLvl3Row", acc.saknr);
                        accItem.setVisible(isExpanded);
                        oList.addItem(accItem);
                    });

                    const subItem = this._mkSubtotal(l2Name + " 계", l2Data.total);
                    subItem.setVisible(isExpanded);
                    oList.addItem(subItem);
                });

                const l1TotalItem = this._mkL1Total(l1Name + " 합계", l1Data.total);
                l1TotalItem.setVisible(isExpanded);
                oList.addItem(l1TotalItem);

                const spacerItem = this._mkSpacer();
                spacerItem.setVisible(isExpanded);
                oList.addItem(spacerItem);

                if (side === "right") {
                    if (cat === "cogs" && !cogsInserted) {
                        cogsInserted = true;
                        oList.addItem(this._mkResultRow("매출총이익 (Gross Profit)", grossProfit));
                        oList.addItem(this._mkSpacer());
                    }
                    if (cat === "sga" && !sgaInserted) {
                        sgaInserted = true;
                        oList.addItem(this._mkResultRow("영업이익 (Operating Income)", opIncome));
                        oList.addItem(this._mkSpacer());
                    }
                }
            });

            if (side === "right") {
                if (!cogsInserted) {
                    oList.addItem(this._mkResultRow("매출총이익 (Gross Profit)", grossProfit));
                    oList.addItem(this._mkSpacer());
                }
                if (!sgaInserted) {
                    oList.addItem(this._mkResultRow("영업이익 (Operating Income)", opIncome));
                    oList.addItem(this._mkSpacer());
                }
            }
        },

        _mkToggleLvl1(l1Name, value, cat, isExpanded) {
            const oItem = mk.cliA();
            oItem.addCustomData(mk.cd("l1Name", l1Name));
            oItem.attachPress(this._onToggleGroup.bind(this));

            const catCssMap = { revenue: "bsIsLvl1Rev", cogs: "bsIsLvl1Cost", sga: "bsIsLvl1Cost", nonop: "bsIsLvl1NonOp" };
            const catCss    = catCssMap[cat] || "";

            const oRow = mk.hbox({ justifyContent: "SpaceBetween", alignItems: "Center" });
            oRow.addStyleClass("bsLvl1Row" + (catCss ? " " + catCss : ""));

            const oLblBox = mk.hbox({ alignItems: "Center" }); oLblBox.addStyleClass("bsIsTreeLblBox");
            const oChev   = mk.text(isExpanded ? "▼" : "▶");   oChev.addStyleClass("bsIsTreeChevron");
            const oLbl    = mk.text(l1Name);                    oLbl.addStyleClass("bsRowLabel");
            oLblBox.addItem(oChev); oLblBox.addItem(oLbl);

            const oNum = mk.text(this._fmt(value)); oNum.addStyleClass("bsRowNum");
            oNum.addStyleClass(value < 0 ? "bsNumNeg" : "bsNumPos");

            oRow.addItem(oLblBox); oRow.addItem(oNum);
            oItem.addContent(oRow);
            return oItem;
        },

        _onToggleGroup(oEvent) {
            const oItem  = oEvent.getSource();
            const l1Name = oItem.data("l1Name");
            if (!l1Name || !this._treeState) return;
            this._treeExpanded[l1Name] = !this._treeExpanded[l1Name];
            const { mLvl1, grossProfit, opIncome, netIncome } = this._treeState;
            this._renderISTree(mLvl1, grossProfit, opIncome, netIncome);
        },

        /* ── 일반 행 ────────────────────────────────────────────── */
        _mkRow(label, value, cssClass, saknr) {
            const oItem = saknr ? mk.cliA() : mk.cli();
            if (saknr) oItem.addCustomData(mk.cd("saknr",   saknr));
            if (value !== null) oItem.addCustomData(mk.cd("balance", String(value)));
            if (saknr) oItem.attachPress(this.onISItemPress.bind(this));

            const oRow = mk.hbox({ justifyContent: "SpaceBetween", alignItems: "Center" });
            oRow.addStyleClass(cssClass);
            const oLbl = mk.text(label);             oLbl.addStyleClass("bsRowLabel");
            const oNum = mk.text(this._fmt(value));  oNum.addStyleClass("bsRowNum");
            oNum.addStyleClass(value < 0 ? "bsNumNeg" : "bsNumPos");
            oRow.addItem(oLbl); oRow.addItem(oNum);
            oItem.addContent(oRow);
            return oItem;
        },

        /* ── 중분류 소계 행 ─────────────────────────────────────── */
        _mkSubtotal(label, value) {
            const oItem = mk.cli();
            const oRow  = mk.hbox({ justifyContent: "SpaceBetween", alignItems: "Center" });
            oRow.addStyleClass("bsSubtotalRow");
            const oL = mk.text(label);            oL.addStyleClass("bsSubtotalLabel");
            const oN = mk.text(this._fmt(value)); oN.addStyleClass("bsSubtotalNum");
            oRow.addItem(oL); oRow.addItem(oN);
            oItem.addContent(oRow);
            return oItem;
        },

        /* ── 대분류 합계 행 ─────────────────────────────────────── */
        _mkL1Total(label, value) {
            const oItem = mk.cli();
            const oRow  = mk.hbox({ justifyContent: "SpaceBetween", alignItems: "Center" });
            oRow.addStyleClass("bsL1TotalRow");
            const oL = mk.text(label);            oL.addStyleClass("bsL1TotalLabel");
            const oN = mk.text(this._fmt(value)); oN.addStyleClass("bsL1TotalNum");
            oRow.addItem(oL); oRow.addItem(oN);
            oItem.addContent(oRow);
            return oItem;
        },

        /* ── IS 결과 행 (매출총이익/영업이익) ── 0001의 bsL1TotalRow보다 강조 ── */
        _mkResultRow(label, value) {
            const oItem = mk.cli();
            const oRow  = mk.hbox({ justifyContent: "SpaceBetween", alignItems: "Center" });
            oRow.addStyleClass("bsIsResultRow");
            const oL = mk.text(label);            oL.addStyleClass("bsIsResultLabel");
            const oN = mk.text(this._fmt(value)); oN.addStyleClass("bsIsResultNum");
            oRow.addStyleClass(value >= 0 ? "bsIsResultPos" : "bsIsResultNeg");
            oRow.addItem(oL); oRow.addItem(oN);
            oItem.addContent(oRow);
            return oItem;
        },

        /* ── 대분류 사이 여백 ──────────────────────────────────── */
        _mkSpacer() {
            const oItem = mk.cli();
            const oV = mk.vbox(); oV.addStyleClass("bsSpacer");
            oItem.addContent(oV);
            return oItem;
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 6] 차트용 데이터 빌드
         * ══════════════════════════════════════════════════════════ */

        /* monatFrom~monatTo 범위의 월 배열 생성 */
        _buildMonatRange(monatFrom, monatTo) {
            const from  = parseInt(monatFrom, 10);
            const to    = parseInt(monatTo,   10);
            const months = [];
            for (let m = from; m <= to; m++) months.push(String(m).padStart(2, "0"));
            return months;
        },

        /* 월별 매출/영업이익 집계 */
        _buildMonthlyData(aItems, G, monatRange) {
            const mMonth = {};
            monatRange.forEach(m => { mMonth[m] = { revenue: 0, opNet: 0 }; });

            aItems.forEach(r => {
                const monat = (G(r, "Monat") || "").padStart(2, "0");
                const lvl1  = (G(r, "FsLvl1") || "").trim();
                const bal   = parseFloat(G(r, "Amount")) || 0;
                if (!mMonth[monat]) return;
                const cat = classifyLvl1(lvl1);
                if      (cat === "revenue") mMonth[monat].revenue += bal;
                else if (cat === "cogs" || cat === "sga") mMonth[monat].opNet -= bal;
            });
            monatRange.forEach(m => { mMonth[m].opNet += mMonth[m].revenue; });

            /* IS_CAT 미매칭 시 fallback: 양수 금액을 월별 매출로 대체 표시 */
            const totalRev = monatRange.reduce((s, m) => s + mMonth[m].revenue, 0);
            if (totalRev === 0) {
                aItems.forEach(r => {
                    const monat = (G(r, "Monat") || "").padStart(2, "0");
                    const bal   = parseFloat(G(r, "Amount")) || 0;
                    if (mMonth[monat] && bal > 0) mMonth[monat].revenue += bal;
                });
                monatRange.forEach(m => { mMonth[m].opNet = mMonth[m].revenue; });
            }

            return {
                months   : monatRange.map(m => m + "월"),
                revenue  : monatRange.map(m => Math.round(mMonth[m].revenue)),
                opIncome : monatRange.map(m => Math.round(mMonth[m].opNet))
            };
        },

        /* 손익센터(Prctr)별 월별 매출 집계 */
        _buildPrctrData(aItems, G, monatRange) {
            const mPrctr = {};
            aItems.forEach(r => {
                const prctr = (G(r, "Prctr") || "기타").trim();
                const lvl1  = (G(r, "FsLvl1") || "").trim();
                const bal   = parseFloat(G(r, "Amount")) || 0;
                const monat = (G(r, "Monat") || "").padStart(2, "0");
                if (classifyLvl1(lvl1) !== "revenue") return;
                if (!mPrctr[prctr]) mPrctr[prctr] = {};
                mPrctr[prctr][monat] = (mPrctr[prctr][monat] || 0) + bal;
            });
            return { prctrKeys: Object.keys(mPrctr), mPrctr, monatRange };
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 7] Chart.js 차트 렌더링
         *   Chart.js가 없으면 조용히 skip (console.warn만 출력)
         *   각 차트 인스턴스를 this._chart* 에 저장 → 재조회 시 destroy 후 재생성
         * ══════════════════════════════════════════════════════════ */
        _renderAllCharts(payload) {
            /* Chart.js 미로드 시 동적 로딩 후 재시도 (FLP 로컬 환경 대응) */
            if (!window.Chart) {
                const src = sap.ui.require.toUrl("zcl3fi/cl33fiproject0003/thirdparty/chart.umd.min.js");
                const s = document.createElement("script");
                s.src = src;
                s.onload  = () => this._renderAllCharts(payload);
                s.onerror = () => MessageToast.show("차트 라이브러리를 불러오지 못했습니다.");
                document.head.appendChild(s);
                return;
            }
            const { monthlyData, prctrData, revenue, cogs, grossProfit, sga, opIncome, nonop, netIncome, mLvl1 } = payload;

            /* 기존 차트 파기 */
            ["_chartMonth","_chartWf","_chartCost","_chartPlant","_chartMargin"].forEach(k => {
                if (this[k]) { try { this[k].destroy(); } catch (e) {} this[k] = null; }
            });

            /* DOM 안정화 대기 (500ms + rAF 2회) */
            setTimeout(() => {
                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => {
                        this._renderMonthChart(monthlyData);
                        this._renderWaterfallChart(revenue, cogs, grossProfit, sga, opIncome, nonop, netIncome);
                        this._renderCostChart(mLvl1);
                        this._renderPlantChart(prctrData, monthlyData.months);
                        this._renderMarginBars(revenue, grossProfit, opIncome, netIncome);
                        this._renderMarginChart(monthlyData);
                    });
                });
            }, 500);
        },

        /* ── 월별 매출·영업이익 막대 차트 ─────────────────────── */
        _renderMonthChart(monthlyData) {
            const canvas = document.getElementById("isMonthCanvas");
            if (!canvas) return;
            const snap   = this._isSnapshot || {};
            const period = snap.gjahr ? snap.gjahr + "년 " + snap.monatFrom + "~" + snap.monatTo + "월" : "";
            const fmtAx  = v => this._fmtAxis(v);
            this._chartMonth = new Chart(canvas, {
                type: "bar",
                data: {
                    labels: monthlyData.months,
                    datasets: [
                        { label: "매출액",   data: monthlyData.revenue,  backgroundColor: COLORS.blue,  borderRadius: 3 },
                        { label: "영업이익", data: monthlyData.opIncome, backgroundColor: COLORS.green, borderRadius: 3 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, labels: { font: { size: 11 }, boxWidth: 12 } },
                        title : { display: !!period, text: period, font: { size: 10 }, color: "#6A6D70", padding: { bottom: 4 } },
                        tooltip: { callbacks: { label: ctx => " " + ctx.dataset.label + ": " + fmtAx(ctx.parsed.y) } }
                    },
                    scales: {
                        x: { ticks: { font: { size: 11 }, autoSkip: false }, grid: { display: false } },
                        y: { ticks: { font: { size: 10 }, callback: fmtAx }, grid: { color: "rgba(128,128,128,0.1)" } }
                    }
                }
            });
        },

        /* ── 이익 흐름 Waterfall (가로 누적 막대) ──────────────── */
        _renderWaterfallChart(revenue, cogs, grossProfit, sga, opIncome, nonop, netIncome) {
            const canvas = document.getElementById("isWfCanvas");
            if (!canvas) return;
            const abs    = Math.abs;
            const snap   = this._isSnapshot || {};
            const period = snap.gjahr ? snap.gjahr + "년 " + snap.monatFrom + "~" + snap.monatTo + "월" : "";
            const fmtAx  = v => this._fmtAxis(v);
            const wfLabels  = ["매출액","매출원가","매출총이익","판관비","영업이익","영업외","순이익"];
            const wfOffsets = [0, abs(grossProfit), 0, abs(opIncome), 0, abs(netIncome), 0];
            const wfValues  = [abs(revenue), abs(cogs), abs(grossProfit), abs(sga), abs(opIncome), abs(nonop), abs(netIncome)];
            const wfColors  = [COLORS.blue, COLORS.red, COLORS.green, COLORS.amber, COLORS.green, COLORS.red, COLORS.green];

            this._chartWf = new Chart(canvas, {
                type: "bar",
                data: {
                    labels: wfLabels,
                    datasets: [
                        { data: wfOffsets, backgroundColor: "transparent", borderColor: "transparent" },
                        { data: wfValues,  backgroundColor: wfColors, borderRadius: 3 }
                    ]
                },
                options: {
                    indexAxis: "y",
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title  : { display: !!period, text: period, font: { size: 10 }, color: "#6A6D70", padding: { bottom: 4 } },
                        tooltip: {
                            callbacks: {
                                label: ctx => ctx.datasetIndex === 1 ? " " + fmtAx(ctx.parsed.x) : null
                            }
                        }
                    },
                    scales: {
                        x: { stacked: true, ticks: { font: { size: 10 }, callback: fmtAx }, grid: { color: "rgba(128,128,128,0.1)" } },
                        y: { stacked: true, ticks: { font: { size: 11 } }, grid: { display: false } }
                    }
                }
            });
        },

        /* ── 비용 구성 도넛 차트 ──────────────────────────────── */
        _renderCostChart(mLvl1) {
            const canvas = document.getElementById("isCostCanvas");
            if (!canvas) return;
            const costCats = ["cogs", "sga", "nonop"];
            const labels = [], data = [];
            Object.entries(mLvl1)
                .filter(([k]) => costCats.includes(classifyLvl1(k)))
                .sort((a, b) => (a[1].seq || "").localeCompare(b[1].seq || ""))
                .forEach(([k, v]) => { labels.push(k); data.push(Math.abs(v.total)); });

            if (!data.length) {
                Object.entries(mLvl1)
                    .sort((a, b) => (a[1].seq || "").localeCompare(b[1].seq || ""))
                    .forEach(([k, v]) => { labels.push(k); data.push(Math.abs(v.total)); });
                if (!data.length) return;
            }
            this._chartCost = new Chart(canvas, {
                type: "doughnut",
                data: {
                    labels,
                    datasets: [{ data, backgroundColor: COLORS.muted.slice(0, data.length), borderWidth: 0 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: "bottom", labels: { font: { size: 10 }, boxWidth: 10 } },
                        tooltip: { callbacks: { label: ctx => " " + ctx.label + ": " + this._fmtAxis(ctx.parsed) } }
                    },
                    cutout: "60%"
                }
            });
        },

        /* ── 손익센터별 매출 비교 막대 차트 ─────────────────────── */
        _renderPlantChart({ prctrKeys, mPrctr, monatRange }, months) {
            const canvas = document.getElementById("isPlantCanvas");
            if (!canvas) return;
            const snap   = this._isSnapshot || {};
            const period = snap.gjahr ? snap.gjahr + "년 " + snap.monatFrom + "~" + snap.monatTo + "월" : "";
            const fmtAx  = v => this._fmtAxis(v);
            const paletteColors = [COLORS.blue, COLORS.light, COLORS.green, "#3B9AC4","#BA7517"];
            const datasets = prctrKeys.map((prctr, i) => ({
                label: prctrLabel(prctr),
                data : monatRange.map(m => Math.round(mPrctr[prctr][m] || 0)),
                backgroundColor: paletteColors[i % paletteColors.length],
                borderRadius: 3
            }));
            this._chartPlant = new Chart(canvas, {
                type: "bar",
                data: { labels: months, datasets },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, labels: { font: { size: 10 }, boxWidth: 10 } },
                        title : { display: !!period, text: period, font: { size: 10 }, color: "#6A6D70", padding: { bottom: 4 } },
                        tooltip: { callbacks: { label: ctx => " " + ctx.dataset.label + ": " + fmtAx(ctx.parsed.y) } }
                    },
                    scales: {
                        x: { ticks: { font: { size: 11 }, autoSkip: false }, grid: { display: false } },
                        y: { ticks: { font: { size: 10 }, callback: fmtAx }, grid: { color: "rgba(128,128,128,0.1)" } }
                    }
                }
            });
        },

        /* ── GP/OP/NP Margin 수평 바 (List) ─────────────────────── */
        _renderMarginBars(revenue, grossProfit, opIncome, netIncome) {
            const oList = this.byId("listIsMarginBars");
            if (!oList) return;
            oList.removeAllItems();
            const pct  = n => revenue > 0 ? Math.round(n / revenue * 1000) / 10 : 0;
            const bars = [
                { label: "GP Margin", pct: pct(grossProfit), color: COLORS.blue  },
                { label: "OP Margin", pct: pct(opIncome),   color: COLORS.green },
                { label: "NP Margin", pct: pct(netIncome),  color: "#639922"    }
            ];
            bars.forEach(b => {
                const oItem = mk.cli();
                const oRow  = mk.hbox({ alignItems: "Center" });
                oRow.addStyleClass("bsIsMarginRow");

                const oLbl = mk.text(b.label); oLbl.addStyleClass("bsIsMarginLbl");

                const oBg   = mk.vbox(); oBg.addStyleClass("bsIsMarginBg");
                const pctW  = Math.min(Math.max(b.pct, 0), 100);
                const oFill = mk.vbox({ width: pctW + "%" }); oFill.addStyleClass("bsIsMarginFill");
                const fillColor = b.color;
                oFill.addEventDelegate({ onAfterRendering() { const d = oFill.getDomRef(); if (d) d.style.background = fillColor; } });
                oBg.addItem(oFill);

                const oNum = mk.text(b.pct + "%"); oNum.addStyleClass("bsIsMarginNum");

                oRow.addItem(oLbl); oRow.addItem(oBg); oRow.addItem(oNum);
                oItem.addContent(oRow);
                oList.addItem(oItem);
            });
        },

        /* ── 월별 OP% 추이 선 차트 ────────────────────────────── */
        _renderMarginChart(monthlyData) {
            const canvas = document.getElementById("isMarginCanvas");
            if (!canvas) return;
            const snap   = this._isSnapshot || {};
            const period = snap.gjahr ? snap.gjahr + "년 " + snap.monatFrom + "~" + snap.monatTo + "월" : "";
            const opPcts = monthlyData.revenue.map((r, i) =>
                r > 0 ? Math.round(monthlyData.opIncome[i] / r * 1000) / 10 : 0
            );
            this._chartMargin = new Chart(canvas, {
                type: "line",
                data: {
                    labels: monthlyData.months,
                    datasets: [
                        { label: "OP%", data: opPcts, borderColor: COLORS.green, backgroundColor: "transparent",
                          pointRadius: 3, tension: 0.3, borderWidth: 1.5, borderDash: [4, 2] }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title : { display: !!period, text: period, font: { size: 10 }, color: "#6A6D70", padding: { bottom: 4 } }
                    },
                    scales: {
                        x: { ticks: { font: { size: 10 }, autoSkip: false }, grid: { display: false } },
                        y: { ticks: { font: { size: 10 }, callback: v => v + "%" }, grid: { color: "rgba(128,128,128,0.1)" } }
                    }
                }
            });
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 8] 드릴다운 팝업
         *   onISItemPress   : 계정(bsLvl3Row) 클릭 → 전표 목록 팝업
         *   onDrillClose    : 닫기
         *   onDrillItemPress: 팝업 행 선택 → 전표번호 저장
         *   onDrillBelnrPress: 전표번호 링크 클릭 → 0002로 이동
         * ══════════════════════════════════════════════════════════ */
        onISItemPress(oEvent) {
            const oItem = oEvent.getSource();
            const saknr = oItem.data("saknr");
            if (!saknr) return;

            const G = (row, k) =>
                row[k] !== undefined ? row[k] :
                row[k.toLowerCase()] !== undefined ? row[k.toLowerCase()] :
                (row[k.toUpperCase()] || "");

            const aItems = this._drillData[saknr] || [];
            const dm     = this.getView().getModel("drillModel");
            dm.setProperty("/title",   "계정 전표 내역");
            dm.setProperty("/saknr",   saknr);
            dm.setProperty("/txt50",   this._acctNames?.[saknr] || "");
            dm.setProperty("/balance", this._fmt(parseFloat(oItem.data("balance")) || 0));
            dm.setProperty("/items",   aItems.map(r => {
                const raw = G(r, "Budat");
                let budat = "";
                if (raw) {
                    const d = raw instanceof Date ? raw : new Date(raw);
                    budat = !isNaN(d.getTime())
                        ? `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`
                        : String(raw).substring(0, 10).replace(/-/g, ".");
                }
                const amt = parseFloat(G(r, "Amount")) || 0;
                return {
                    belnr  : G(r, "Belnr") || "",
                    budat,
                    monat  : (G(r, "Monat") || "") + "월",
                    prctr  : prctrLabel(G(r, "Prctr") || "") || "-",
                    amount : this._fmt(amt) + " " + (G(r, "Waers") || "KRW"),
                    amtNeg : amt < 0
                };
            }));

            if (!this._dlg) this._dlg = this.byId("dlgDrill");
            this._dlg.open();
        },

        onDrillClose() { this._dlg?.close(); },

        onDrillItemPress(oEvent) {
            const oCtx = oEvent.getSource().getBindingContext("drillModel");
            if (oCtx) this._selectedDrillBelnr = oCtx.getProperty("belnr");
        },

        onDrillBelnrPress(oEvent) {
            const sBelnr = oEvent.getSource().getText();
            const sGjahr = this.byId("inpGjahr").getValue();
            this._dlg?.close();
            this._navigateToFI0002(sBelnr, sGjahr);
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 8-1] 회계연도 탐색도움말 (F4 Value Help)
         * ══════════════════════════════════════════════════════════ */
        onGjahrValueHelp() {
            const cur = new Date().getFullYear();
            const years = [];
            for (let y = cur + 1; y >= 2020; y--) years.push({ Year: String(y) });

            if (!this._gjahrDialog) {
                const oYearModel = new JSONModel({ items: years });
                this._gjahrDialog = new SelectDialog({
                    title: "회계연도 선택",
                    noDataText: "연도를 찾을 수 없습니다.",
                    items: {
                        path: "gjahr>/items",
                        template: new StandardListItem({ title: "{gjahr>Year}" })
                    },
                    confirm: (oEvt) => {
                        const oSel = oEvt.getParameter("selectedItem");
                        if (oSel) this.byId("inpGjahr").setValue(oSel.getTitle());
                    },
                    search: (oEvt) => {
                        const sVal = oEvt.getParameter("value") || "";
                        oEvt.getSource().getBinding("items").filter(
                            sVal ? [new Filter("Year", FilterOperator.Contains, sVal)] : []
                        );
                    }
                });
                this._gjahrDialog.setModel(oYearModel, "gjahr");
                this.getView().addDependent(this._gjahrDialog);
            } else {
                this._gjahrDialog.getModel("gjahr").setProperty("/items", years);
            }
            this._gjahrDialog.open();
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 8-2] 손익센터 탐색도움말 (F4 Value Help)
         * ══════════════════════════════════════════════════════════ */
        onPrctrValueHelp() {
            const bukrs = this.byId("inpBukrs").getValue();
            const gjahr = (this.byId("inpGjahr").getValue() || "").trim()
                         || String(new Date().getFullYear());
            const oModel = this.getOwnerComponent().getModel();

            if (!this._prctrDialog) {
                const oPrctrModel = new JSONModel({ items: [] });
                this._prctrDialog = new SelectDialog({
                    title: "손익센터 선택",
                    noDataText: "조회 결과가 없습니다.",
                    items: {
                        path: "prctr>/items",
                        template: new StandardListItem({
                            title      : "{prctr>Label}",
                            description: "{prctr>Prctr}"
                        })
                    },
                    confirm: (oEvt) => {
                        const oSel = oEvt.getParameter("selectedItem");
                        if (oSel) {
                            const oCtx = oSel.getBindingContext("prctr");
                            this.byId("inpPrctr").setValue(oCtx.getProperty("Prctr"));
                        }
                    },
                    search: (oEvt) => {
                        const sVal = oEvt.getParameter("value") || "";
                        oEvt.getSource().getBinding("items").filter(
                            sVal ? [new Filter("Label", FilterOperator.Contains, sVal)] : []
                        );
                    }
                });
                this._prctrDialog.setModel(oPrctrModel, "prctr");
                this.getView().addDependent(this._prctrDialog);
            }

            this.getView().setBusy(true);
            oModel.read("/ISdataSet", {
                filters: [
                    new Filter("Bukrs", FilterOperator.EQ, bukrs),
                    new Filter("Gjahr", FilterOperator.EQ, gjahr)
                ],
                urlParameters: { "$select": "Prctr", "$top": "500" },
                success: (oData) => {
                    this.getView().setBusy(false);
                    const seen = new Set();
                    const aItems = [];
                    (oData.results || []).forEach(r => {
                        const p = (r.Prctr || "").trim();
                        if (p && !seen.has(p)) {
                            seen.add(p);
                            aItems.push({ Prctr: p, Label: prctrLabel(p) });
                        }
                    });
                    aItems.sort((a, b) => a.Label.localeCompare(b.Label));
                    this._prctrDialog.getModel("prctr").setData({ items: aItems });
                    this._prctrDialog.open();
                },
                error: () => {
                    this.getView().setBusy(false);
                    this._prctrDialog.getModel("prctr").setData({ items: [] });
                    this._prctrDialog.open();
                }
            });
        },

        _navigateToFI0002(sBelnr, sGjahr) {
            /* FLP 환경: CrossApplicationNavigation으로 직접 이동
             *   Semantic Object : CL3FIDoc
             *   Action          : display
             *   (피오리 런치패드 URL: #CL3FIDoc-display?Belnr=xxx&Gjahr=xxx)
             */
            if (sap.ushell && sap.ushell.Container) {
                sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                    target: { semanticObject: "CL3FIDoc", action: "display" },
                    params: { Belnr: sBelnr, Gjahr: sGjahr, "sap-app-origin-hint": "" }
                });
                return;
            }
            /* FLP 밖(로컬 npm run start 또는 단독 배포): URL 직접 생성 */
            window.open(this._get0002PreviewUrl(sBelnr, sGjahr), "_blank");
        },

        /* 0002 URL 생성 (FLP 없는 환경 전용)
         *   1순위: PREVIEW_0002_BASE 상수 (로컬 개발 시 직접 설정)
         *   2순위: npm run start — 경로 내 0003 → 0002 치환
         *   3순위: 배포 서버 — window.location.origin 기반 FLP URL 구성
         */
        _get0002PreviewUrl(sBelnr, sGjahr) {
            const enc = s => encodeURIComponent(s);
            if (PREVIEW_0002_BASE) {
                return PREVIEW_0002_BASE + "/index.html#?Belnr=" + enc(sBelnr) + "&Gjahr=" + enc(sGjahr);
            }
            const sPath = window.location.pathname;
            if (sPath.includes("cl3_3_fi_project_0003")) {
                return window.location.origin
                    + sPath.replace("cl3_3_fi_project_0003", "cl3_3_fi_project_0002")
                    + "#?Belnr=" + enc(sBelnr) + "&Gjahr=" + enc(sGjahr);
            }
            /* 배포 서버: FLP URL 직접 구성 */
            return window.location.origin
                + "/sap/bc/ui2/flp?sap-client=100&sap-language=KO#CL3FIDoc-display?Belnr="
                + enc(sBelnr) + "&Gjahr=" + enc(sGjahr) + "&sap-app-origin-hint=";
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 9] PDF / Excel 내보내기
         * ══════════════════════════════════════════════════════════ */
        onPressPdf() {
            if (!this._isSnapshot) { MessageToast.show("먼저 조회를 실행해주세요."); return; }
            const ids = ["isMonthCanvas","isWfCanvas","isCostCanvas","isPlantCanvas","isMarginCanvas"];
            const imgs = {};
            ids.forEach(id => {
                const c = document.getElementById(id);
                try { imgs[id] = c ? c.toDataURL("image/png") : ""; } catch (e) { imgs[id] = ""; }
            });
            const w = window.open("", "_blank", "width=1100,height=820");
            if (!w) { MessageToast.show("팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요."); return; }
            w.document.write(this._buildPrintHtml(imgs));
            w.document.close();
            setTimeout(() => w.print(), 900);
        },

        onPressExcel() {
            if (!this._isSnapshot) { MessageToast.show("먼저 조회를 실행해주세요."); return; }
            try {
                const blob = new Blob([this._buildExcelHtml()], { type: "application/vnd.ms-excel;charset=UTF-8" });
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement("a");
                const { gjahr, monatFrom, monatTo } = this._isSnapshot;
                a.href = url;
                a.download = `손익계산서_${gjahr}_${monatFrom}~${monatTo}.xls`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (e) { this._downloadCsv(); }
        },

        _buildIsTableBody(mLvl1, grossProfit, opIncome, netIncome, fmtAbs, fmtSign, esc, rowCss) {
            const sorted = Object.entries(mLvl1).sort((a, b) => (a[1].seq || "").localeCompare(b[1].seq || ""));
            let html = "";
            let cogsD = false, sgaD = false;
            const C = rowCss;
            sorted.forEach(([l1, l1d]) => {
                const cat = classifyLvl1(l1);
                html += `<tr class="${C.r1}"><td colspan="2">${esc(l1)}</td><td class="${C.n}">${fmtAbs(l1d.total)}</td></tr>`;
                Object.entries(l1d.lvl2s).forEach(([l2, l2d]) => {
                    html += `<tr class="${C.r2}"><td></td><td>${esc(l2)}</td><td class="${C.n}">${fmtAbs(l2d.total)}</td></tr>`;
                    l2d.accounts.sort((a, b) => a.saknr.localeCompare(b.saknr)).forEach(a =>
                        html += `<tr class="${C.r3}"><td></td><td>${esc(a.txt50 ? a.saknr + "  " + a.txt50 : a.saknr)}</td><td class="${C.n}">${fmtSign(a.balance)}</td></tr>`
                    );
                    html += `<tr class="${C.rs}"><td></td><td>${esc(l2 + " 계")}</td><td class="${C.n}">${fmtAbs(l2d.total)}</td></tr>`;
                });
                html += `<tr class="${C.rt}"><td colspan="2">${esc(l1 + " 합계")}</td><td class="${C.n}">${fmtAbs(l1d.total)}</td></tr>`;
                if (cat === "cogs" && !cogsD) { cogsD = true; html += `<tr class="${C.rg}"><td colspan="2">매출총이익 &nbsp;<span class="${C.rgsub}">Gross Profit</span></td><td class="${C.n} ${C.rgn}">${fmtSign(grossProfit)}</td></tr><tr class="${C.sp}"><td colspan="3"></td></tr>`; }
                if (cat === "sga"  && !sgaD)  { sgaD  = true; html += `<tr class="${C.rg}"><td colspan="2">영업이익 &nbsp;<span class="${C.rgsub}">Operating Income</span></td><td class="${C.n} ${C.rgn}">${fmtSign(opIncome)}</td></tr><tr class="${C.sp}"><td colspan="3"></td></tr>`; }
            });
            html += `<tr class="${C.rtot}"><td colspan="2">당기순이익 &nbsp;<span style="font-size:0.85em;opacity:.8">Net Income</span></td><td class="${C.n}">${fmtSign(netIncome)}</td></tr>`;
            return html;
        },

        _buildPrintHtml(imgs) {
            imgs = imgs || {};
            const { mLvl1, revenue, cogs, grossProfit, sga, opIncome, nonop, netIncome, bukrs, gjahr, monatFrom, monatTo } = this._isSnapshot;
            const fmt  = v => Math.abs(typeof v === "number" ? v : parseFloat(v) || 0).toLocaleString("ko-KR", { maximumFractionDigits: 0 });
            const fmtS = v => (typeof v === "number" ? v : parseFloat(v) || 0).toLocaleString("ko-KR", { maximumFractionDigits: 0 });
            const pct  = (n, d) => d > 0 ? (Math.round(n / d * 1000) / 10) + "%" : "-%";
            const esc  = s => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

            const C = {
                r1:"r1", r2:"r2", r3:"r3", rs:"rs", rt:"rt",
                rg:"rg", rgsub:"rgsub", rgn:"rgn", sp:"sp", rtot:"rtot", n:"n"
            };
            const tbody = this._buildIsTableBody(mLvl1, grossProfit, opIncome, netIncome, fmt, fmtS, esc, C);

            const chartBlock = (id, title) => imgs[id]
                ? `<div class="cc"><div class="ct">${title}</div><img src="${imgs[id]}" alt="${title}"/></div>`
                : "";
            const hasCharts = Object.values(imgs).some(v => !!v);

            return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>손익계산서 ${gjahr}년</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Malgun Gothic',Arial,sans-serif;font-size:9pt;background:#fff;color:#222}
/* ─ Header ─ */
.hdr{background:linear-gradient(135deg,#003D82 0%,#0070D2 100%);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:flex-start}
.hl-co{font-size:7.5pt;opacity:.7;margin-bottom:4px;letter-spacing:.3px}
.hl-title{font-size:18pt;font-weight:700;letter-spacing:-.5px}
.hl-title span{font-size:11pt;font-weight:300;opacity:.75;margin-left:8px}
.hl-sub{font-size:8pt;opacity:.8;margin-top:5px}
.hr{text-align:right}.hr .period{font-size:13pt;font-weight:700}.hr .dt{font-size:7.5pt;opacity:.7;margin-top:4px}
/* ─ KPI ─ */
.kpi{display:flex;background:#EEF5FF;border-bottom:3px solid #0070D2}
.kc{flex:1;padding:8px 12px;border-right:1px solid #C8DCFF}.kc:last-child{border-right:none}
.kl{font-size:7pt;color:#5A6D8A;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
.kv{font-size:11.5pt;font-weight:700;font-family:Consolas,monospace;white-space:nowrap}
.ks{font-size:7pt;color:#888;margin-top:2px}
.c-bl{color:#0057b8}.c-rd{color:#BB0000}.c-gn{color:#0A6E30}
/* ─ Legend ─ */
.legend{background:#f8f8f8;border-bottom:1px solid #e4e4e4;padding:4px 20px;font-size:7.5pt;color:#999;font-style:italic}
/* ─ Section header ─ */
.sh{background:#F0F4F8;border-left:4px solid #0070D2;padding:5px 10px;font-size:8.5pt;font-weight:700;color:#00177C;margin:14px 0 8px}
/* ─ Charts ─ */
.cg2{display:flex;gap:10px;margin-bottom:10px;page-break-inside:avoid}
.cg3{display:flex;gap:8px;margin-bottom:10px;page-break-inside:avoid}
.cc{flex:1;border:1px solid #e0e0e0;border-radius:3px;padding:8px;background:#fff}
.ct{font-size:7.5pt;font-weight:700;color:#444;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #f0f0f0}
.cc img{width:100%;height:auto;display:block}
/* ─ IS table ─ */
table{width:100%;border-collapse:collapse;page-break-inside:auto}
thead th{background:#0070D2;color:#fff;padding:6px 8px;font-size:8.5pt;text-align:left;white-space:nowrap}
thead th:last-child{text-align:right;width:23%}
td{padding:3.5px 8px;font-size:8pt;border-bottom:1px solid #f2f2f2;vertical-align:middle}
td.n{text-align:right;font-family:Consolas,"Courier New",monospace;white-space:nowrap}
.r1 td{background:#E8F0FF;color:#00177C;font-weight:700;border-top:1px solid #B8CCF0}
.r2 td{color:#555;padding-left:20px!important;background:#FAFCFF}
.r3 td{color:#7A7A7A;padding-left:36px!important;font-size:7.5pt}
.rs td{font-weight:600;background:#EEF2F8;border-top:1px solid #D0DAE8;padding-left:20px!important}
.rt td{background:#E0EAF8;color:#00177C;font-weight:700;border-top:2px solid #0070D2}
.rg td{background:#107E3E;color:#fff;font-weight:700;font-size:8.5pt;border-top:2px solid #0A5E2E;border-bottom:2px solid #0A5E2E}
.rgsub{font-size:7.5pt;font-weight:400;opacity:.8}
.rgn{color:#AFFFCF!important}
.sp td{height:7px;background:#fff;border:none}
.rtot td{background:#003D82;color:#fff;font-weight:700;font-size:9pt;border-top:2px solid #002468}
/* ─ Footer ─ */
.ft{margin-top:12px;padding:5px 10px;font-size:7pt;color:#bbb;border-top:1px solid #e8e8e8;display:flex;justify-content:space-between}
@media print{@page{size:A4;margin:8mm}body{font-size:8.5pt}.hdr{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="hdr">
  <div>
    <div class="hl-co">HubRoad Co. &nbsp;·&nbsp; 회사코드: ${esc(bukrs)}</div>
    <div class="hl-title">손익계산서<span>Income Statement</span></div>
    <div class="hl-sub">단위: KRW &nbsp;·&nbsp; ZCDS_C3_FI_0002_CDS &nbsp;·&nbsp; ISdataSet</div>
  </div>
  <div class="hr">
    <div class="period">${gjahr}년 ${monatFrom}~${monatTo}월</div>
    <div class="dt">출력일: ${new Date().toLocaleDateString("ko-KR")}</div>
  </div>
</div>
<div class="kpi">
  <div class="kc"><div class="kl">매출액</div><div class="kv c-bl">${fmt(revenue)}</div></div>
  <div class="kc"><div class="kl">매출원가</div><div class="kv c-rd">${fmt(cogs)}</div></div>
  <div class="kc"><div class="kl">매출총이익 (GP)</div><div class="kv c-gn">${fmtS(grossProfit)}</div><div class="ks">GP Margin ${pct(grossProfit, revenue)}</div></div>
  <div class="kc"><div class="kl">영업이익 (OP)</div><div class="kv c-gn">${fmtS(opIncome)}</div><div class="ks">OP Margin ${pct(opIncome, revenue)}</div></div>
  <div class="kc"><div class="kl">당기순이익 (NP)</div><div class="kv c-gn">${fmtS(netIncome)}</div><div class="ks">NP Margin ${pct(netIncome, revenue)}</div></div>
</div>
<div class="legend">GP: Gross Profit Margin (매출총이익률) &nbsp;|&nbsp; OP: Operating Profit Margin (영업이익률) &nbsp;|&nbsp; NP: Net Profit Margin (순이익률)</div>
${hasCharts ? `<div class="sh">&#x1F4CA; 분석 차트</div>
<div class="cg2">
  ${chartBlock("isMonthCanvas", "월별 매출 · 영업이익 추이")}
  ${chartBlock("isWfCanvas",    "이익 흐름 (Waterfall)")}
</div>
<div class="cg3">
  ${chartBlock("isCostCanvas",   "비용 구성 비율")}
  ${chartBlock("isPlantCanvas",  "손익센터별 매출")}
  ${chartBlock("isMarginCanvas", "이익률 추이")}
</div>` : ""}
<div class="sh">&#x1F4CB; 손익계산서 상세 내역</div>
<table>
  <thead><tr><th colspan="2">항목</th><th>금액 (KRW)</th></tr></thead>
  <tbody>${tbody}</tbody>
</table>
<div class="ft">
  <span>ZCDS_C3_FI_0002_CDS · ISdataSet · 단위: KRW</span>
  <span>${new Date().toLocaleString("ko-KR")}</span>
</div>
</body></html>`;
        },

        _buildExcelHtml() {
            const { mLvl1, revenue, grossProfit, opIncome, netIncome, bukrs, gjahr, monatFrom, monatTo } = this._isSnapshot;
            const fmt  = v => Math.abs(typeof v === "number" ? v : parseFloat(v) || 0).toLocaleString("ko-KR", { maximumFractionDigits: 0 });
            const fmtS = v => (typeof v === "number" ? v : parseFloat(v) || 0).toLocaleString("ko-KR", { maximumFractionDigits: 0 });
            const esc  = s => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const NR   = "text-align:right;font-family:Consolas,'Courier New',monospace;";
            const inl  = (style, s) => `<td style="${style}">${s}</td>`;

            const sorted = Object.entries(mLvl1).sort((a, b) => (a[1].seq || "").localeCompare(b[1].seq || ""));
            let tbody = "";
            let cogsD = false, sgaD = false;
            sorted.forEach(([l1, l1d]) => {
                const cat = classifyLvl1(l1);
                tbody += `<tr>
  ${inl("background:#DCE9FF;color:#00177C;font-weight:bold;border-top:2px solid #0070D2", esc(l1))}
  ${inl("background:#DCE9FF;border-top:2px solid #0070D2", "")}
  ${inl("background:#DCE9FF;color:#0070D2;font-weight:bold;border-top:2px solid #0070D2;" + NR, fmt(l1d.total))}</tr>`;
                Object.entries(l1d.lvl2s).forEach(([l2, l2d]) => {
                    tbody += `<tr>
  ${inl("background:#F4F7FF;border-top:1px solid #E0E8F4", "")}
  ${inl("background:#F4F7FF;color:#444;padding-left:18px;border-top:1px solid #E0E8F4", esc(l2))}
  ${inl("background:#F4F7FF;border-top:1px solid #E0E8F4;" + NR, fmt(l2d.total))}</tr>`;
                    l2d.accounts.sort((a, b) => a.saknr.localeCompare(b.saknr)).forEach(a =>
                        tbody += `<tr>
  ${inl("", "")}
  ${inl("color:#777;padding-left:32px;font-size:7.5pt", esc(a.txt50 ? a.saknr + "  " + a.txt50 : a.saknr))}
  ${inl("color:#888;font-size:7.5pt;" + NR, fmtS(a.balance))}</tr>`
                    );
                    tbody += `<tr>
  ${inl("background:#EAF0F8", "")}
  ${inl("background:#EAF0F8;font-weight:600;padding-left:18px;border-top:1px solid #D0DAE8", esc(l2 + " 계"))}
  ${inl("background:#EAF0F8;font-weight:600;border-top:1px solid #D0DAE8;" + NR, fmt(l2d.total))}</tr>`;
                });
                tbody += `<tr>
  ${inl("background:#D8E8FA;color:#00177C;font-weight:bold;border-top:2px solid #0070D2", esc(l1 + " 합계"))}
  ${inl("background:#D8E8FA;border-top:2px solid #0070D2", "")}
  ${inl("background:#D8E8FA;color:#0070D2;font-weight:bold;border-top:2px solid #0070D2;" + NR, fmt(l1d.total))}</tr>`;
                if (cat === "cogs" && !cogsD) {
                    cogsD = true;
                    tbody += `<tr>${inl("background:#107E3E;color:#fff;font-weight:bold;border-top:2px solid #0A5E2E", "매출총이익")}${inl("background:#107E3E;color:#fff;font-size:7.5pt;border-top:2px solid #0A5E2E", "Gross Profit")}${inl("background:#107E3E;color:#AFFFCF;font-weight:bold;border-top:2px solid #0A5E2E;" + NR, fmtS(grossProfit))}</tr><tr><td colspan="3" style="height:8px;background:#fff;border:none"></td></tr>`;
                }
                if (cat === "sga" && !sgaD) {
                    sgaD = true;
                    tbody += `<tr>${inl("background:#107E3E;color:#fff;font-weight:bold;border-top:2px solid #0A5E2E", "영업이익")}${inl("background:#107E3E;color:#fff;font-size:7.5pt;border-top:2px solid #0A5E2E", "Operating Income")}${inl("background:#107E3E;color:#AFFFCF;font-weight:bold;border-top:2px solid #0A5E2E;" + NR, fmtS(opIncome))}</tr><tr><td colspan="3" style="height:8px;background:#fff;border:none"></td></tr>`;
                }
            });
            tbody += `<tr>${inl("background:#003D82;color:#fff;font-weight:bold;font-size:9.5pt;border-top:2px solid #001A5C", "당기순이익")}${inl("background:#003D82;color:#fff;font-size:7.5pt;border-top:2px solid #001A5C", "Net Income")}${inl("background:#003D82;color:#7FFFBA;font-weight:bold;font-size:9.5pt;border-top:2px solid #001A5C;" + NR, fmtS(netIncome))}</tr>`;

            return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>손익계산서_${gjahr}_${monatFrom}~${monatTo}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Malgun Gothic',Arial,sans-serif;font-size:9pt;background:#fff}
.info{display:flex;justify-content:space-between;align-items:baseline;padding:8px 4px 10px;border-bottom:2px solid #0070D2;margin-bottom:10px}
.info-l .title{font-size:13pt;font-weight:700;color:#00177C}
.info-l .sub{font-size:8pt;color:#6A6D70;margin-top:3px}
.info-r{font-size:9pt;font-weight:600;color:#0070D2}
table{width:100%;border-collapse:collapse}
th{background:#0070D2;color:#fff;padding:5px 8px;font-size:8.5pt;text-align:left;white-space:nowrap}
th:last-child{text-align:right;width:26%}
td{padding:3.5px 8px;border:1px solid #eee;vertical-align:middle}
.ft{font-size:7pt;color:#bbb;text-align:right;padding:6px 0 0;border-top:1px solid #eee;margin-top:8px}
</style></head><body>
<div class="info">
  <div class="info-l">
    <div class="title">손익계산서 (Income Statement)</div>
    <div class="sub">HubRoad Co. &nbsp;|&nbsp; 회사코드: ${esc(bukrs)} &nbsp;|&nbsp; 단위: KRW</div>
  </div>
  <div class="info-r">${gjahr}년 ${monatFrom}~${monatTo}월</div>
</div>
<table>
  <thead><tr><th colspan="2">항목</th><th>금액 (KRW)</th></tr></thead>
  <tbody>${tbody}</tbody>
</table>
<div class="ft">ZCDS_C3_FI_0002_CDS · ISdataSet &nbsp;|&nbsp; ${new Date().toLocaleString("ko-KR")}</div>
</body></html>`;
        },

        _downloadCsv() {
            const { mLvl1, netIncome, gjahr, monatFrom, monatTo } = this._isSnapshot;
            const fmt = v => (typeof v==="number"?v:parseFloat(v)||0).toLocaleString("ko-KR",{maximumFractionDigits:0});
            let rows = "대분류,중분류,계정번호,계정명,금액(KRW)\n";
            Object.entries(mLvl1).sort((a,b)=>(a[1].seq||"").localeCompare(b[1].seq||"")).forEach(([l1,l1d]) => {
                Object.entries(l1d.lvl2s).forEach(([l2,l2d]) => {
                    l2d.accounts.forEach(a =>
                        rows += `"${l1}","${l2}","${a.saknr}","${a.txt50||""}","${fmt(a.balance)}"\n`
                    );
                });
            });
            rows += `,,,,\n"당기순이익",,,,"${fmt(netIncome)}"\n`;
            const blob = new Blob(["﻿" + rows], { type: "text/csv;charset=utf-8" });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href = url; a.download = `손익계산서_${gjahr}_${monatFrom}~${monatTo}.csv`;
            a.click(); URL.revokeObjectURL(url);
        },

        /* ══════════════════════════════════════════════════════════
         * [섹션 10] 포맷팅 유틸리티 (0001과 동일)
         * ══════════════════════════════════════════════════════════ */
        _fmt(v) {
            const n = typeof v === "number" ? v : parseFloat(v) || 0;
            return n.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
        },

        _fmtKo(v) {
            const n   = typeof v === "number" ? v : parseFloat(v) || 0;
            const neg = n < 0, abs = Math.abs(n);
            if (!abs) return "0원";
            const EOK = 100_000_000, MAN = 10_000;
            const eok = Math.floor(abs / EOK), man = Math.floor((abs % EOK) / MAN);
            let s = eok > 0 ? eok + "억" : "";
            if (man > 0) s += man + "만";
            if (!s) s = abs.toLocaleString("ko-KR");
            return (neg ? "-" : "") + s + "원";
        },

        _fmtDelta(v) {
            const n = typeof v === "number" ? v : parseFloat(v) || 0;
            return (n >= 0 ? "+" : "-") + Math.abs(n).toLocaleString("ko-KR", { maximumFractionDigits: 0 });
        },

        _fmtAxis(v) {
            const abs = Math.abs(v), sign = v < 0 ? "-" : "";
            if (abs >= 1000000000) return sign + (Math.round(abs / 100000000) / 10) + "억";
            if (abs >= 100000000)  return sign + Math.round(abs / 100000000) + "억";
            if (abs >= 10000000)   return sign + Math.round(abs / 10000000) + "천만";
            if (abs >= 10000)      return sign + Math.round(abs / 10000) + "만";
            return sign + abs.toLocaleString("ko-KR");
        }

    });
});

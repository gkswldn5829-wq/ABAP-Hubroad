sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/m/Image",
    "sap/m/VBox",
    "sap/m/Text"
], function (Controller, JSONModel, Filter, FilterOperator, MessageBox, MessageToast, Fragment,
    MImage, MVBox, MText) {
    "use strict";

    return Controller.extend("zc33approval.cl33fiproject0005.controller.cl3_3_fi_project_0005", {

        /* ═══════════════════════════════════════════════════════
           LIFECYCLE
           ═══════════════════════════════════════════════════════ */
        onInit: function () {
            var oViewModel = new JSONModel({
                hasSelection   : false,
                busy           : false,
                listCount      : 0,
                selectedHeader : {},
                items          : [],
                totalDebit     : 0,
                totalCredit    : 0,
                hasAttachments : false,
                vhItems        : [],
                balanced     : true,
                tlActive01   : false,
                tlActive02   : false,
                tlActive05   : false
            });
            this.getView().setModel(oViewModel, "view");
        },

        /* ═══════════════════════════════════════════════════════
           LIST EVENTS
           ═══════════════════════════════════════════════════════ */

        // 목록 데이터 로드 완료 후 건수 배지 업데이트
        onListUpdateFinished: function (oEvent) {
            var nTotal = oEvent.getParameter("total");
            this.getView().getModel("view").setProperty("/listCount", nTotal);
        },

        // 전표 카드 클릭 → 디테일 패널 로드
        onVoucherPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            if (!oItem) return;

            var oCtx    = oItem.getBindingContext();
            if (!oCtx) return;
            var oHeader = Object.assign({}, oCtx.getObject());

            var oVM = this.getView().getModel("view");
            oVM.setProperty("/selectedHeader", oHeader);
            oVM.setProperty("/hasSelection",   true);
            oVM.setProperty("/items",          []);
            oVM.setProperty("/totalDebit",     0);
            oVM.setProperty("/totalCredit",    0);
            oVM.setProperty("/balanced",       true);

            this._updateTimelineClasses(oHeader.Zstat);
            this._loadLineItems(oHeader.Bukrs, oHeader.Belnr, oHeader.Gjahr);
            this._loadAttachments(oHeader.Bukrs, oHeader.Belnr, oHeader.Gjahr);
        },

        // 검색창 입력 → 클라이언트 측 필터 (Input으로 변경되어 query와 value 모두 대응)
        onSearch: function (oEvent) {
            var sVal     = (oEvent.getParameter("query") || oEvent.getParameter("newValue") || oEvent.getParameter("value") || "").trim();
            var oList    = this.getView().byId("approvalList");
            var oBinding = oList.getBinding("items");
            if (!oBinding) return;

            if (sVal) {
                oBinding.filter([
                    new Filter({
                        filters: [
                            new Filter("Belnr", FilterOperator.Contains, sVal),
                            new Filter("Bktxt", FilterOperator.Contains, sVal),
                            new Filter("Ernam", FilterOperator.Contains, sVal)
                        ],
                        and: false
                    })
                ]);
            } else {
                oBinding.filter([]);
            }
        },

        /* ═══════════════════════════════════════════════════════
           VALUE HELP (SEARCH HELP)
           ═══════════════════════════════════════════════════════ */

        // 탐색도움말 오픈: 필터 초기화 후 기본 목록 로드
        onValueHelpRequest: function () {
            var oView = this.getView();
            if (!this._pValueHelpDialog) {
                this._pValueHelpDialog = Fragment.load({
                    id: oView.getId(),
                    name: "zc33approval.cl33fiproject0005.view.fragments.BelnrValueHelp",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    this._oVHDialog = oDialog;
                    return oDialog;
                }.bind(this));
            }
            this._pValueHelpDialog.then(function (oDialog) {
                ["vhInBelnr", "vhInGjahr", "vhInErnam", "vhInBktxt"].forEach(function (sId) {
                    var o = oView.byId(sId);
                    if (o) { o.setValue(""); }
                });
                oDialog.open();
                this._loadVHData(); // 팝업 열릴 때 기본 목록 로드
            }.bind(this));
        },

        // 검색 버튼 / Enter
        onValueHelpSearch: function () {
            this._loadVHData();
        },

        // OData 조회 → view>/vhItems 세팅 (0002 _loadVHData 방식 동일)
        _loadVHData: function () {
            var oView  = this.getView();
            var oVM    = oView.getModel("view");
            var oModel = oView.getModel();

            var val = function (sId) {
                var o = oView.byId(sId);
                return o ? (o.getValue() || "").trim() : "";
            };
            var sBelnr = val("vhInBelnr");
            var sGjahr = val("vhInGjahr");
            var sErnam = val("vhInErnam");
            var sBktxt = val("vhInBktxt");

            var aFilters = [new Filter("Zstat", FilterOperator.EQ, "01")];
            if (sBelnr) { aFilters.push(new Filter("Belnr", FilterOperator.Contains, sBelnr)); }
            if (sGjahr) { aFilters.push(new Filter("Gjahr", FilterOperator.EQ,       sGjahr)); }
            if (sErnam) { aFilters.push(new Filter("Ernam", FilterOperator.Contains, sErnam)); }
            if (sBktxt) { aFilters.push(new Filter("Bktxt", FilterOperator.Contains, sBktxt)); }

            oVM.setProperty("/vhItems", []);

            oModel.read("/ApprovalHeaderSetSet", {
                filters: [new Filter({ filters: aFilters, and: true })],
                success: function (oData) {
                    var aVH = (oData.results || []).map(function (r) {
                        return {
                            Belnr:    r.Belnr,
                            Gjahr:    r.Gjahr,
                            Budat:    r.Budat,
                            Blart:    r.Blart || "—",
                            Bktxt:    (r.Bktxt && r.Bktxt.trim()) ? r.Bktxt.trim() : "—",
                            Ernam:    r.Ernam || "—",
                            Wrbtr:    r.Wrbtr,
                            Waers:    r.Waers,
                            Bukrs:    r.Bukrs,
                            Zstat:    r.Zstat
                        };
                    });
                    oVM.setProperty("/vhItems", aVH);
                },
                error: function () {
                    MessageToast.show("전표 목록 조회 중 오류가 발생했습니다.");
                }
            });
        },

        // 행 클릭 → 디테일 패널 즉시 로드
        onValueHelpItemSelect: function (oEvent) {
            var oCtx    = oEvent.getSource().getBindingContext("view");
            if (!oCtx) { return; }
            var oRow    = oCtx.getObject();

            if (this._oVHDialog) { this._oVHDialog.close(); }

            var oSearchField = this.getView().byId("searchField");
            if (oSearchField) { oSearchField.setValue(oRow.Belnr); }

            var oList = this.getView().byId("approvalList");
            var oBinding = oList.getBinding("items");
            if (oBinding) {
                oBinding.filter([new Filter({
                    filters: [
                        new Filter("Belnr", FilterOperator.EQ, oRow.Belnr),
                        new Filter("Gjahr", FilterOperator.EQ, oRow.Gjahr)
                    ],
                    and: true
                })]);
            }

            var oVM = this.getView().getModel("view");
            oVM.setProperty("/selectedHeader", oRow);
            oVM.setProperty("/hasSelection",   true);
            oVM.setProperty("/items",          []);
            oVM.setProperty("/totalDebit",     0);
            oVM.setProperty("/totalCredit",    0);
            oVM.setProperty("/balanced",       true);
            this._updateTimelineClasses(oRow.Zstat);
            this._loadLineItems(oRow.Bukrs, oRow.Belnr, oRow.Gjahr);
            this._loadAttachments(oRow.Bukrs, oRow.Belnr, oRow.Gjahr);
        },

        onValueHelpCancel: function () {
            if (this._oVHDialog) { this._oVHDialog.close(); }
        },

        /* ═══════════════════════════════════════════════════════
           ACTION BUTTONS
           ═══════════════════════════════════════════════════════ */

        // 승인 버튼 (Zstat 01 → 02) 또는 재상신 버튼 (Zstat 05 → 01)
        onApprove: function () {
            var oHeader = this.getView().getModel("view").getProperty("/selectedHeader");
            if (!oHeader || !oHeader.Belnr) return;

            var bResubmit = (oHeader.Zstat === "05");
            var sTitle    = bResubmit ? "재상신 확인"  : "승인 확인";
            var sMsg      = bResubmit
                ? "전표 [" + oHeader.Belnr + "] 를\n수정 완료하여 결재선으로 재상신하시겠습니까?"
                : "전표 [" + oHeader.Belnr + "] 를\n최종 승인(장부 반영)하시겠습니까?";

            MessageBox.confirm(sMsg, {
                title   : sTitle,
                actions : [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose : function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this._doUpdate(oHeader, "A");
                    }
                }.bind(this)
            });
        },

        // 반려 버튼 (Zstat 01 → 05)
        onReject: function () {
            var oHeader = this.getView().getModel("view").getProperty("/selectedHeader");
            if (!oHeader || !oHeader.Belnr) return;

            MessageBox.confirm(
                "전표 [" + oHeader.Belnr + "] 를\n반려(수정 보류) 처리 하시겠습니까?", {
                title   : "반려 확인",
                actions : [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose : function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this._doUpdate(oHeader, "R");
                    }
                }.bind(this)
            });
        },

        /* ═══════════════════════════════════════════════════════
           PRIVATE: OData 호출
           ═══════════════════════════════════════════════════════ */

        // 라인 아이템 조회 (ApprovalItemSetSet)
        _loadLineItems: function (sBukrs, sBelnr, sGjahr) {
            var oModel = this.getView().getModel();
            var oVM    = this.getView().getModel("view");
            oVM.setProperty("/busy", true);

            oModel.read("/ApprovalItemSetSet", {
                filters: [
                    new Filter("Bukrs", FilterOperator.EQ, sBukrs),
                    new Filter("Belnr", FilterOperator.EQ, sBelnr),
                    new Filter("Gjahr", FilterOperator.EQ, sGjahr)
                ],
                success: function (oData) {
                    var aItems   = oData.results || [];
                    var nDebit   = 0;
                    var nCredit  = 0;

                    aItems.forEach(function (oItem) {
                        var fAmt = parseFloat(oItem.Wrbtr) || 0;
                        if (oItem.Shkzg === "S") { nDebit  += fAmt; }
                        else                     { nCredit += fAmt; }
                    });

                    oVM.setProperty("/items",       aItems);
                    oVM.setProperty("/totalDebit",  nDebit);
                    oVM.setProperty("/totalCredit", nCredit);
                    oVM.setProperty("/balanced",    Math.abs(nDebit - nCredit) < 0.01);
                    oVM.setProperty("/busy",        false);
                }.bind(this),
                error: function () {
                    oVM.setProperty("/busy", false);
                    MessageBox.error("라인 아이템 조회 중 오류가 발생했습니다.");
                }
            });
        },

        // 첨부파일 조회 (ZGWC3FI0001_SRV / AttachmentSet) — image/* 파일만 표시
        _loadAttachments: function (sBukrs, sBelnr, sGjahr) {
            var oVM  = this.getView().getModel("view");
            var oBox = this.getView().byId("attachmentBox5");
            oBox.destroyItems();
            oVM.setProperty("/hasAttachments", false);

            var sBase   = "/sap/opu/odata/sap/ZGWC3FI0001_SRV/";
            var sFilter = encodeURIComponent(
                "Bukrs eq '" + sBukrs + "' and Belnr eq '" + sBelnr + "' and Gjahr eq '" + sGjahr + "'"
            );
            var sUrl = sBase + "AttachmentSet"
                + "?$filter=" + sFilter
                + "&$select=Bukrs,Belnr,Gjahr,Seqno,Filename,Mimetype"
                + "&$format=json";

            jQuery.ajax({
                url: sUrl,
                headers: { "Accept": "application/json" },
                success: function (oData) {
                    var aResults = (oData.d && oData.d.results) || [];
                    var aImages  = aResults.filter(function (r) {
                        return (r.Mimetype || "").toLowerCase().indexOf("image/") === 0;
                    });
                    if (!aImages.length) { return; }

                    aImages.forEach(function (r) {
                        var sKey = "Bukrs='" + r.Bukrs + "',Belnr='" + r.Belnr
                                 + "',Gjahr='" + r.Gjahr + "',Seqno='" + r.Seqno + "'";
                        var sSrc = sBase + "AttachmentSet(" + sKey + ")/Filedata/$value";

                        var oImg = new MImage({
                            src: sSrc,
                            densityAware: false,
                            press: (function (url) {
                                return function () { window.open(url, "_blank"); };
                            }(sSrc))
                        });
                        oImg.addStyleClass("fiAttachImg");

                        var oLabel = new MText({
                            text: (r.Filename || ("첨부 " + r.Seqno)),
                            wrapping: false
                        });
                        oLabel.addStyleClass("fiAttachName");

                        var oItem = new MVBox({ alignItems: "Center" });
                        oItem.addStyleClass("fiAttachItem");
                        oItem.addItem(oImg);
                        oItem.addItem(oLabel);
                        oBox.addItem(oItem);
                    });

                    oVM.setProperty("/hasAttachments", true);
                }.bind(this),
                error: function () { /* 첨부파일 없으면 조용히 무시 */ }
            });
        },

        // 결재 처리 (OData PATCH → approvalheaderse_update_entity)
        _doUpdate: function (oHeader, sAction) {
            var oModel      = this.getView().getModel();
            var oVM         = this.getView().getModel("view");
            var oCommentCtl = this.getView().byId("commentInput");

            var sPath = oModel.createKey("/ApprovalHeaderSetSet", {
                Bukrs: oHeader.Bukrs,
                Belnr: oHeader.Belnr,
                Gjahr: oHeader.Gjahr
            });

            // 오늘 날짜를 YYYYMMDD 포맷 문자열로 생성
            var oNow    = new Date();
            var sToday  = oNow.getFullYear().toString()
                        + String(oNow.getMonth() + 1).padStart(2, "0")
                        + String(oNow.getDate()).padStart(2, "0");

            // 결재자 ID: SAP Fiori Shell 환경이면 UserInfo 서비스에서,
            // 아닐 경우 빈 문자열(백엔드 sy-uname 사용)
            var sApprBy = "";
            try {
                sApprBy = sap.ushell.Container.getService("UserInfo").getId() || "";
            } catch (e) { /* Shell 미사용 환경 – 백엔드에서 처리 */ }

            var oPayload = {
                Bukrs       : oHeader.Bukrs,
                Belnr       : oHeader.Belnr,
                Gjahr       : oHeader.Gjahr,
                Action      : sAction,
                Appr_remark : oCommentCtl ? oCommentCtl.getValue() : "",
                Appr_by     : sApprBy,
                Appr_date   : sToday
            };

            oVM.setProperty("/busy", true);

            oModel.update(sPath, oPayload, {
                success: function () {
                    // 최신 상태를 서버에서 재조회
                    oModel.read(sPath, {
                        success: function (oUpdated) {
                            var oNew = Object.assign({}, oUpdated);
                            oVM.setProperty("/selectedHeader", oNew);
                            oVM.setProperty("/busy",           false);
                            this._updateTimelineClasses(oNew.Zstat);

                            // 목록 새로고침 (처리된 전표는 zstat='01' 필터에서 제외됨)
                            var oList = this.getView().byId("approvalList");
                            if (oList) { oList.getBinding("items").refresh(); }

                            // 결재 의견 초기화
                            if (oCommentCtl) { oCommentCtl.setValue(""); }

                            var sMsg = sAction === "A"
                                ? (oHeader.Zstat === "05" ? "재상신 처리가 완료되었습니다." : "승인 처리가 완료되었습니다.")
                                : "반려 처리가 완료되었습니다.";
                            MessageToast.show(sMsg, { duration: 3000 });
                        }.bind(this),
                        error: function () {
                            oVM.setProperty("/busy", false);
                        }
                    });
                }.bind(this),
                error: function (oError) {
                    oVM.setProperty("/busy", false);
                    var sErrMsg = "처리 중 오류가 발생했습니다.";
                    try {
                        var oResp = JSON.parse(oError.responseText);
                        sErrMsg   = (oResp.error && oResp.error.message && oResp.error.message.value)
                            ? oResp.error.message.value
                            : sErrMsg;
                    } catch (e) { /* JSON 파싱 실패 무시 */ }
                    MessageBox.error(sErrMsg, { title: "처리 오류" });
                }.bind(this)
            });
        },

        /* ═══════════════════════════════════════════════════════
           PRIVATE: 타임라인 CSS 클래스 갱신
           ★ XML view class 속성은 addStyleClass()에 매핑되어
             모델 변경 시 자동 갱신이 안 됨 → 컨트롤러에서 직접 제어
           ═══════════════════════════════════════════════════════ */
        _updateTimelineClasses: function (sZstat) {
            var aSteps = [
                { id: "tlStep01", code: "01", extra: "s01" },
                { id: "tlStep05", code: "05", extra: "s05" },
                { id: "tlStep02", code: "02", extra: "s02" }
            ];
            aSteps.forEach(function (oStep) {
                var oCtl = this.getView().byId(oStep.id);
                if (!oCtl) { return; }
                var bActive = (sZstat === oStep.code);
                oCtl.toggleStyleClass("tlActive", bActive);
                oCtl.toggleStyleClass(oStep.extra,  bActive);
            }, this);
        },

        /* ═══════════════════════════════════════════════════════
           FORMATTERS
           ═══════════════════════════════════════════════════════ */

        // 금액 → 한국식 천단위 (원화)
        formatCurrency: function (sVal) {
            if (sVal === null || sVal === undefined || sVal === "") return "0";
            var fVal = parseFloat(sVal);
            return isNaN(fVal) ? "0" : Math.round(fVal).toLocaleString("ko-KR");
        },

        // ZSTAT 코드 → 한글 상태명
        formatStatText: function (sZstat) {
            var mMap = {
                "01": "결재 대기",
                "02": "승인 완료(기장)",
                "05": "반려 (수정 필요)"
            };
            return mMap[sZstat] || (sZstat ? "상태: " + sZstat : "-");
        },

        // ZSTAT → SAP ObjectStatus state 값
        formatStatState: function (sZstat) {
            if (sZstat === "02") return "Success";
            if (sZstat === "05") return "Error";
            return "Warning";
        },

        // 승인 버튼 텍스트 (상태에 따라 분기)
        formatApproveText: function (sZstat) {
            return sZstat === "05" ? "수정 후 재상신" : "승인(전기)";
        },

        // 승인 버튼 표시 여부 (01 또는 05 상태만)
        isApproveVisible: function (sZstat) {
            return sZstat === "01" || sZstat === "05";
        },

        // 반려 버튼 표시 여부 (01 상태만)
        isRejectVisible: function (sZstat) {
            return sZstat === "01";
        },

        // 차대변 구분 → ObjectStatus state
        formatShkzgState: function (sShkzg) {
            return sShkzg === "S" ? "Information" : "Warning";
        },

        // 차대변 균형 결과 텍스트
        formatBalancedText: function (bBalanced) {
            return bBalanced ? "차대변 밸런스 검증 일치" : "차대변 불균형 오류 발생";
        },

        // 차대변 균형 결과 state
        formatBalancedState: function (bBalanced) {
            return bBalanced ? "Success" : "Error";
        },

        // 상세 헤더 부제목 (전기일자 · 기안자 · 회계기간)
        formatHeaderMeta: function (sBudat, sErnam, sMonat) {
            var aParts = [];
            if (sBudat) aParts.push(sBudat + " 전기일자");
            if (sErnam) aParts.push(sErnam + " 담당기안");
            if (sMonat) aParts.push(sMonat + "월 회계");
            return aParts.join("  ·  ");
        },

        // 전표번호 + 회계연도 타이틀
        formatBelnrTitle: function (sBelnr, sGjahr) {
            if (!sBelnr) return "전표를 선택하세요";
            return sBelnr + (sGjahr ? "  ·  회계연도 " + sGjahr : "");
        }
    });
});

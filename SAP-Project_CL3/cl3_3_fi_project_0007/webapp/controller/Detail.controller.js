sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
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
], function (Controller, History, JSONModel, Dialog, SearchField, MTable, MColumn, ColumnListItem, MText, MButton, formatter, MessageToast, MessageBox) {
    "use strict";

    var ACTION_NS = "com.sap.gateway.srvd.zrap_cl3_fi_01_srv.v0001.";

    // 탐색도움말 설정
    // entity: 메인 서비스에 expose된 VH 엔티티셋 이름
    // staticData: 서버 조회 없이 정적 데이터를 사용하는 필드
    var VH_CONFIG = {
        Saknr:   { entity: "AccountVH",    title: "계정항목 선택", key: "Saknr",  columns: [{label:"계정번호", path:"Saknr", width:"10rem"}, {label:"계정명", path:"AccountName"}, {label:"유형", path:"AccountType", width:"8rem"}] },
        Afaknr:  { entity: "AccountVH",    title: "계정항목 선택", key: "Saknr",  columns: [{label:"계정번호", path:"Saknr", width:"10rem"}, {label:"계정명", path:"AccountName"}, {label:"유형", path:"AccountType", width:"8rem"}] },
        Aufaknr: { entity: "AccountVH",    title: "계정항목 선택", key: "Saknr",  columns: [{label:"계정번호", path:"Saknr", width:"10rem"}, {label:"계정명", path:"AccountName"}, {label:"유형", path:"AccountType", width:"8rem"}] },
        Anlkl:   { entity: "SectionVH",    title: "자산분류 선택",  key: "Anlkl",       columns: [{label:"분류코드",   path:"Anlkl",          width:"10rem"}, {label:"분류명칭", path:"ClassName"}] },
        Status:  { entity: "AssetStateVH", title: "자산상태 선택",  key: "Status",      columns: [{label:"상태코드",   path:"Status",         width:"10rem"}, {label:"상태명칭", path:"StatusText"}] },
        Afamid:  { entity: "MethodVH",     title: "상각방법 선택",  key: "Afamid",      columns: [{label:"상각코드",   path:"Afamid",         width:"10rem"}, {label:"상각방법", path:"MethodText"}] },
        Kostl:   { entity: "CostcenterVH",   title: "코스트센터 선택", key: "CostCenter",  columns: [{label:"코스트센터", path:"CostCenter",      width:"10rem"}, {label:"명칭", path:"CostCenterName"}] },
        Werks:   { entity: "PlantVH",        title: "플랜트 선택",   key: "Plant", columns: [{label:"플랜트", path:"Plant", width:"8rem"}, {label:"공장이름",   path:"Pname"}] },
        Prctr:   { entity: "ProfitCenterVH", title: "손익센터 선택", key: "Prctr", columns: [{label:"손익센터", path:"Prctr", width:"10rem"},{label:"손익센터명", path:"Ktext"}] }
    };

    return Controller.extend("zc3fiasset27.assetmanagement.controller.Detail", {

        formatter: formatter,

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteDetail").attachPatternMatched(this._onObjectMatched, this);
        },

        // ── 라우트 매칭 → 뷰 바인딩 ───────────────────────────
        // Codex 권고: created() 이후 oContext.getPath()를 직접 사용하면
        // 복합키 URL 인코딩 오류 없이 안전하게 바인딩 가능
        _onObjectMatched: function (oEvent) {
            var oArgs  = oEvent.getParameter("arguments");
            var sBukrs = decodeURIComponent(oArgs.Bukrs);
            if (sBukrs === "_") { sBukrs = ""; } // 빈 Bukrs 플레이스홀더 복원
            var sAnlnr = decodeURIComponent(oArgs.Anlnr);
            // "false"이면 신규 초안(IsActiveEntity=false)
            var bIsActive = oArgs.IsActiveEntity !== "false";

            var sPath = "/Asset(Bukrs='" + sBukrs + "',Anlnr='" + sAnlnr + "',IsActiveEntity=" + bIsActive + ")";

            this.getView().bindElement({
                path: sPath,
                parameters: {
                    $select: [
                        "Bukrs", "Anlnr", "Anltx", "Anlkl",
                        "Saknr", "Afaknr", "Aufaknr",
                        "Aktiv", "Anschw", "Kansw", "Bchwrt", "Salvage",
                        "Ndjar", "Afamid",
                        "Werks", "Kostl", "Prctr", "Lifnr",
                        "Status", "StatusText", "StatusCriticality",
                        "Deakt", "Waers", "IsActiveEntity", "HasDraftEntity"
                    ].join(","),
                    $expand: "DraftAdministrativeData($select=DraftIsCreatedByMe,InProcessByUser)"
                },
                events: {
                    dataReceived: this._onDataReceived.bind(this),
                    patchSent: this._onPatchSent.bind(this),
                    patchCompleted: this._onPatchCompleted.bind(this)
                }
            });
        },

        _onDataReceived: function (oEvent) {
            var oData = oEvent.getParameter("data");
            if (!oData) {
                MessageBox.error("자산 데이터를 불러올 수 없습니다.");
            }
        },

        // ── DraftIndicator: PATCH 전송/완료 이벤트 ────────────
        _onPatchSent: function () {
            var oDI = this.byId("draftIndicator");
            if (oDI) { oDI.showDraftSaving(); }
        },

        _onPatchCompleted: function (oEvent) {
            var oDI = this.byId("draftIndicator");
            if (!oDI) { return; }
            if (oEvent.getParameter("success")) {
                oDI.showDraftSaved();
            } else {
                oDI.clearDraftState();
                MessageToast.show("자동 저장 중 오류가 발생했습니다.");
            }
        },

        // ── 목록으로 돌아가기 ──────────────────────────────────
        onNavBack: function () {
            var oHistory = History.getInstance();
            if (oHistory.getPreviousHash() !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("Routecl3_3_fi_project_0007", {}, true);
            }
            
            // 목록으로 돌아갈 때 메인 테이블 데이터 갱신 (드래프트 상태 반영)
            // Component.byId()는 {componentId}---id 형태를 찾으므로,
            // rootView(id="App") 내부 컨트롤을 찾으려면 getRootControl().byId()를 사용해야 함
            var oRootView = this.getOwnerComponent().getRootControl();
            var oNavContainer = oRootView && oRootView.byId("app");
            if (oNavContainer) {
                var oListPage = oNavContainer.getPages().find(function(p) {
                    return typeof p.getViewName === "function" &&
                           p.getViewName() === "zc3fiasset27.assetmanagement.view.cl3_3_fi_project_0007";
                });
                if (oListPage) {
                    var oTable = oListPage.byId("assetTable");
                    if (oTable && oTable.getBinding("items")) {
                        oTable.getBinding("items").refresh();
                    }
                }
            }
        },

        // ── 저장 (Activate: 초안 → 활성 엔티티) ───────────────
        onSave: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oCtx = oView.getBindingContext();
            if (!oCtx) { return; }

            var oDI = this.byId("draftIndicator");
            if (oDI) { oDI.showDraftSaving(); }

            var oOperation = oModel.bindContext(ACTION_NS + "Activate(...)", oCtx);
            oOperation.execute()
                .then(function (oActivatedCtx) {
                    if (oDI) { oDI.showDraftSaved(); }
                    MessageToast.show("자산이 성공적으로 저장되었습니다.");

                    // 활성 엔티티로 네비게이션
                    var sBukrs = oCtx.getProperty("Bukrs");
                    var sAnlnr = (oCtx.getProperty("Anlnr") || "").trim();
                    this.getOwnerComponent().getRouter().navTo("RouteDetail", {
                        Bukrs: encodeURIComponent(sBukrs || "_"),
                        Anlnr: encodeURIComponent(sAnlnr),
                        IsActiveEntity: "true"
                    }, true);
                }.bind(this))
                .catch(function (oError) {
                    if (oDI) { oDI.clearDraftState(); }
                    MessageBox.error(
                        "저장 실패:\n" + (oError.message || "유효성 검사 오류가 발생했습니다.")
                    );
                });
        },

        // ── 취소 (Discard: 초안 삭제) ─────────────────────────
        onCancel: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oCtx = oView.getBindingContext();
            if (!oCtx) { return; }

            var bIsNewDraft = !oCtx.getProperty("HasActiveEntity");
            var sMsg = bIsNewDraft
                ? "새 자산 초안을 삭제하시겠습니까?\n저장되지 않은 내용이 사라집니다."
                : "수정 내용을 취소하시겠습니까?\n변경 사항이 모두 취소됩니다.";

            MessageBox.confirm(sMsg, {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.CANCEL,
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }

                    var oOperation = oModel.bindContext(ACTION_NS + "Discard(...)", oCtx);
                    oOperation.execute()
                        .then(function () {
                            this.onNavBack();
                        }.bind(this))
                        .catch(function () {
                            // Discard 실패해도 목록으로 이동
                            this.onNavBack();
                        }.bind(this));
                }.bind(this)
            });
        },

        // ── 수정 버튼 클릭 ──────────────────────────────────────
        // HasDraftEntity=true: Edit 액션 없이 Draft로 직접 이동 (Lock 우회)
        // HasDraftEntity=false: Edit 액션으로 신규 Draft 생성
        onEdit: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oCtx = oView.getBindingContext();
            if (!oCtx) { return; }

            var sBukrs   = oCtx.getProperty("Bukrs") || "";
            var sAnlnr   = (oCtx.getProperty("Anlnr") || "").trim();
            var bHasDraft   = oCtx.getProperty("HasDraftEntity");
            var bIsMyDraft  = oCtx.getProperty("DraftAdministrativeData/DraftIsCreatedByMe");
            var sLockedBy   = oCtx.getProperty("DraftAdministrativeData/InProcessByUser") || "";

            // 내 Draft 존재 → Edit 액션(Lock 유발) 없이 Draft 화면으로 직접 이동
            if (bHasDraft && bIsMyDraft !== false) {
                this.getOwnerComponent().getRouter().navTo("RouteDetail", {
                    Bukrs: encodeURIComponent(sBukrs || "_"),
                    Anlnr: encodeURIComponent(sAnlnr),
                    IsActiveEntity: "false"
                }, true);
                return;
            }

            // 타 사용자 Draft로 잠금 → 안내 메시지
            if (bHasDraft && bIsMyDraft === false) {
                MessageBox.warning(
                    "다른 사용자(" + (sLockedBy || "알 수 없음") + ")가 현재 이 자산을 편집 중입니다.\n" +
                    "해당 사용자가 저장 또는 취소할 때까지 수정할 수 없습니다.",
                    { title: "편집 잠금" }
                );
                return;
            }

            // Draft 없음 → Edit 액션으로 신규 Draft 생성
            var oOperation = oModel.bindContext(ACTION_NS + "Edit(...)", oCtx);
            oOperation.setParameter("PreserveChanges", true);
            oView.setBusy(true);
            oOperation.execute()
                .then(function () {
                    this.getOwnerComponent().getRouter().navTo("RouteDetail", {
                        Bukrs: encodeURIComponent(sBukrs || "_"),
                        Anlnr: encodeURIComponent(sAnlnr),
                        IsActiveEntity: "false"
                    }, true);
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error(
                        "수정 모드 전환 실패:\n" + (oError.message || "서버 오류"),
                        { title: "편집 불가" }
                    );
                })
                .finally(function () { oView.setBusy(false); });
        },

        // ── 감가상각 (draft 모드에서는 백엔드가 차단) ────────
        onDepreciate: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oCtx = oView.getBindingContext();
            if (!oCtx) { return; }

            var sAnltx = oCtx.getProperty("Anltx") || oCtx.getProperty("Anlnr");
            MessageBox.confirm("'" + sAnltx + "'\n자산의 감가상각을 실행하시겠습니까?", {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    oView.setBusy(true);
                    var oOp = oModel.bindContext(ACTION_NS + "depreciate(...)", oCtx);
                    oOp.execute()
                        .then(function () {
                            MessageToast.show("감가상각이 실행되었습니다.");
                            oCtx.refresh();
                        })
                        .catch(function (oErr) {
                            MessageBox.error("감가상각 오류:\n" + (oErr.message || "서버 오류"));
                        })
                        .finally(function () { oView.setBusy(false); });
                }
            });
        },

        // ── 처분 (draft 모드에서는 백엔드가 차단) ────────────
        onDispose: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oCtx = oView.getBindingContext();
            if (!oCtx) { return; }

            var sAnltx = oCtx.getProperty("Anltx") || oCtx.getProperty("Anlnr");
            MessageBox.confirm(
                "'" + sAnltx + "'\n자산을 처분 처리하시겠습니까?\n처분 후에는 되돌릴 수 없습니다.", {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.CANCEL,
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    oView.setBusy(true);
                    var oOp = oModel.bindContext(ACTION_NS + "dispose(...)", oCtx);
                    oOp.execute()
                        .then(function () {
                            MessageToast.show("처분 처리가 완료되었습니다.");
                            oCtx.refresh();
                        })
                        .catch(function (oErr) {
                            MessageBox.error("처분 오류:\n" + (oErr.message || "서버 오류"));
                        })
                        .finally(function () { oView.setBusy(false); });
                }
            });
        },

        // ══════════════════════════════════════════════
        // 공용 탐색도움말 (Value Help)
        // ══════════════════════════════════════════════

        onValueHelpRequest: function (oEvent) {
            var oSource = oEvent.getSource();
            var oBinding = oSource.getBinding("value");
            // 보다 확실한 필드명 추출
            var sPath = oBinding ? oBinding.getPath().split("/").pop() : "";

            if (!VH_CONFIG[sPath]) {
                // 대소문자 문제 체크
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
            var that = this;
            var oTable = this._oVHDialog.getContent()[1];
            var oConf = VH_CONFIG[this._sCurrentVHField];

            oTable.setBusy(true);

            var pData;
            if (oConf.staticData) {
                pData = Promise.resolve(oConf.staticData.slice());
            } else {
                // 메인 서비스에 expose된 VH 엔티티를 fetch로 조회
                // getServiceUrl()로 manifest의 서비스 URL을 동적으로 참조
                var aFields = oConf.columns.map(function (c) { return c.path; });
                var sBase = that.getView().getModel().getServiceUrl();
                var sUrl = sBase + oConf.entity + "?$format=json&$select=" + aFields.join(",") + "&$top=200";
                pData = fetch(sUrl, { credentials: "include" })
                    .then(function (res) {
                        if (!res.ok) { throw new Error("HTTP " + res.status); }
                        return res.json();
                    })
                    .then(function (json) { return json.value || []; });
            }

            pData.then(function (aData) {
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
            }).catch(function () {
                MessageToast.show("데이터 로드 실패: 서버 연결을 확인하세요.");
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
            var oCtx = this.getView().getBindingContext();
            
            if (oCtx && this._sCurrentVHField) {
                oCtx.setProperty(this._sCurrentVHField, oData[oConf.key]);
            }
            this._oVHDialog.close();
        }
    });
});

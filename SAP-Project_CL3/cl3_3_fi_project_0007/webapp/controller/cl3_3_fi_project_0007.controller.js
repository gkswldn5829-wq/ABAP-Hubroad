sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/Button",
    "zc3fiasset27/assetmanagement/model/formatter",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, SelectDialog, StandardListItem, Dialog, Input, Label, Button, formatter, MessageToast, MessageBox) {
    "use strict";

    // 컬럼 설정 마스터 (id = View XML Column id, locked = 항상 표시)
    var COL_SETTINGS = [
        { id: "colAnlnr",  label: "자산번호",      locked: true  },
        { id: "colAnltx",  label: "자산명",         locked: true  },
        { id: "colAnlkl",  label: "분류",           locked: false },
        { id: "colWerks",  label: "플랜트",         locked: false },
        { id: "colAktiv",  label: "취득일",         locked: false },
        { id: "colAnschw", label: "취득가액",       locked: false },
        { id: "colKansw",  label: "감가상각누계",   locked: false },
        { id: "colBchwrt", label: "장부가액",       locked: true  },
        { id: "colAfamid", label: "상각방법",       locked: false },
        { id: "colNdjar",  label: "내용연수",       locked: false },
        { id: "colStatus", label: "자산상태",       locked: false }
    ];

    // RAP Draft 규칙: 리스트는 Active 엔티티와 아직 활성본이 없는 신규 초안을 조회
    // Draft 여부는 HasDraftEntity + DraftAdministrativeData/DraftIsCreatedByMe로 판단
    var BASE_ACTIVE_FILTER = "IsActiveEntity eq true or (IsActiveEntity eq false and HasActiveEntity eq false)";

    return Controller.extend("zc3fiasset27.assetmanagement.controller.cl3_3_fi_project_0007", {

        formatter: formatter,

        onInit: function () {
            // XML 바인딩 parameters.$filter가 초기 로드를 처리하므로 별도 호출 불필요
        },

        // ── 테이블 카운트 + 집계행 업데이트 ─────────────────
        onTableUpdateFinished: function (oEvent) {
            var oTable = this.byId("assetTable");
            oTable.setBusy(false);

            var iTotal = oEvent.getParameter("total");
            this.byId("countText").setText(iTotal > 0 ? "(총 " + iTotal + "건)" : "");
            this._updateSummaryRow();
        },

        _updateSummaryRow: function () {
            var oTable = this.byId("assetTable");
            var aItems = oTable.getItems();
            var fAnschw = 0, fKansw = 0, fBchwrt = 0;

            aItems.forEach(function (oItem) {
                var oCtx = oItem.getBindingContext();
                if (!oCtx || !oCtx.getProperty("Anlnr")) { return; } // 데이터가 로드된 항목만
                
                // OData V4에서는 getProperty가 원시값을 반환
                var vAnschw = oCtx.getProperty("Anschw");
                var vKansw = oCtx.getProperty("Kansw");
                var vBchwrt = oCtx.getProperty("Bchwrt");

                fAnschw += parseFloat(vAnschw || 0);
                fKansw  += parseFloat(vKansw  || 0);
                fBchwrt += parseFloat(vBchwrt || 0);
            });

            var fmt = function (n) {
                return (n === 0 && aItems.length === 0) ? "-" : Math.round(n).toLocaleString("ko-KR") + " KRW";
            };

            this.byId("summaryCount").setText("표시 " + aItems.length + "건");
            this.byId("sumAnschw").setText(fmt(fAnschw));
            this.byId("sumKansw").setText(fmt(fKansw));
            this.byId("sumBchwrt").setText(fmt(fBchwrt));
        },

        // ── 필터 적용 (IsActiveEntity eq true 기반) ────────
        onFilter: function () {
            var oTable = this.byId("assetTable");
            var oBinding = oTable.getBinding("items");
            if (!oBinding) { return; }

            var aUserParts = [];

            var sAnlkl = this.byId("filterAnlkl").getSelectedKey();
            if (sAnlkl) { aUserParts.push("Anlkl eq '" + sAnlkl + "'"); }

            var sWerks = this.byId("filterWerks").getSelectedKey();
            if (sWerks) { aUserParts.push("Werks eq '" + sWerks + "'"); }

            var sStatus = this.byId("filterStatus").getSelectedKey();
            if (sStatus !== "") { aUserParts.push("Status eq '" + sStatus + "'"); }

            var sSearch = this.byId("searchField").getValue().trim();
            if (sSearch) {
                aUserParts.push("contains(Anltx,'" + sSearch.replace(/'/g, "''") + "')");
            }

            var sFinal = aUserParts.length > 0
                ? "(" + BASE_ACTIVE_FILTER + ") and " + aUserParts.join(" and ")
                : BASE_ACTIVE_FILTER;

            // dataRequested(요청 시작) / dataReceived(응답 수신) 쌍으로 busy 관리.
            // 수동 setBusy(true) 제거 — 요청이 실제로 발생할 때만 busy가 켜지고,
            // 0건 포함 모든 응답에서 dataReceived가 발화해 반드시 꺼진다.
            if (!this._bBindingEventsAttached) {
                this._bBindingEventsAttached = true;
                oBinding.attachEvent("dataRequested", function () {
                    oTable.setBusy(true);
                });
                oBinding.attachEvent("dataReceived", function (oEvent) {
                    oTable.setBusy(false);
                    var oError = oEvent.getParameter("error");
                    if (oError) {
                        MessageBox.error("데이터 조회 실패:\n" + (oError.message || "서버 오류가 발생했습니다."));
                    }
                });
            }

            if (this._sLastFilter === sFinal) {
                oBinding.refresh();
            } else {
                this._sLastFilter = sFinal;
                oBinding.changeParameters({ $filter: sFinal });
            }

            MessageToast.show("데이터를 조회합니다.");
        },

        // ── 행 클릭 → RAP Draft Navigation ──────────────────
        // DraftAdministrativeData/DraftIsCreatedByMe = true 이면 Draft 편집, 아니면 조회
        onSelectAsset: function (oEvent) {
            var oItem    = oEvent.getParameter("listItem") || oEvent.getSource();
            var oContext = oItem ? oItem.getBindingContext() : null;

            if (!oContext) {
                MessageToast.show("컨텍스트를 찾을 수 없습니다.");
                return;
            }

            var sBukrs = oContext.getProperty("Bukrs") || "_";
            var sAnlnr = (oContext.getProperty("Anlnr") || "").trim();

            if (!sAnlnr) {
                MessageToast.show("자산번호가 없습니다. 경로: " + oContext.getPath());
                return;
            }

            var bIsActive  = oContext.getProperty("IsActiveEntity");
            var bHasDraft  = oContext.getProperty("HasDraftEntity");
            var bHasActive = oContext.getProperty("HasActiveEntity");

            // RAP Draft 분기 처리:
            // 1. 신규 초안 (IsActiveEntity=false, HasActiveEntity=false) → RouteDetail(IsActiveEntity=false)
            // 2. 작성 중인 초안이 있는 경우 (HasDraftEntity=true) → RouteDetail(IsActiveEntity=false)
            // 3. 일반 활성 엔티티 → RouteDetail(IsActiveEntity=true)
            var sIsActive = (bIsActive === false || bHasDraft === true) ? "false" : "true";

            this.getOwnerComponent().getRouter().navTo("RouteDetail", {
                Bukrs: encodeURIComponent(sBukrs),
                Anlnr: encodeURIComponent(sAnlnr),
                IsActiveEntity: sIsActive
            });
        },

        // ── 컬럼 표시 설정 (SelectDialog P13N) ─────────────────
        onColumnSettings: function () {
            var that = this;

            if (!this._oColDialog) {
                // 현재 Column visible 상태 반영
                var aItems = COL_SETTINGS.map(function (oSetting) {
                    var oCol = that.byId(oSetting.id);
                    var bVisible = oCol ? oCol.getVisible() : true;
                    return new StandardListItem({
                        title: oSetting.label,
                        description: oSetting.locked ? "항상 표시" : "",
                        selected: bVisible,
                        key: oSetting.id
                    });
                });

                this._oColDialog = new SelectDialog({
                    title: "컬럼 표시 설정",
                    multiSelect: true,
                    rememberSelections: true,
                    confirm: function (oEvent) {
                        var aSelected = oEvent.getParameter("selectedItems");
                        var oSelectedMap = {};
                        aSelected.forEach(function (oSel) { oSelectedMap[oSel.getKey()] = true; });

                        COL_SETTINGS.forEach(function (oSetting) {
                            if (oSetting.locked) { return; }
                            var oCol = that.byId(oSetting.id);
                            if (oCol) { oCol.setVisible(!!oSelectedMap[oSetting.id]); }
                        });
                    },
                    liveChange: function (oEvent) {
                        var sVal = (oEvent.getParameter("value") || "").toLowerCase();
                        var aItems = oEvent.getSource().getItems();
                        aItems.forEach(function (oItem) {
                            oItem.setVisible(!sVal || oItem.getTitle().toLowerCase().indexOf(sVal) !== -1);
                        });
                    }
                });

                aItems.forEach(function (oItem) { that._oColDialog.addItem(oItem); });
                this.getView().addDependent(this._oColDialog);
            } else {
                // 재오픈 시 현재 visible 상태로 selected 동기화
                this._oColDialog.getItems().forEach(function (oItem) {
                    var oCol = that.byId(oItem.getKey());
                    oItem.setSelected(oCol ? oCol.getVisible() : true);
                });
            }

            this._oColDialog.open();
        },

        // ── 행 삭제 ────────────────────────────────────────
        // - 활성 엔티티: _AssetHist에 Belnr 있으면 삭제 차단 (프론트 선검증)
        // - 드래프트(신규 초안): Discard(...) 액션 (전표 불가 → 이력 체크 skip)
        onDeleteAsset: function () {
            var that      = this;
            var oTable    = this.byId("assetTable");
            var aSelected = oTable.getSelectedItems();

            if (!aSelected.length) {
                MessageBox.warning("삭제할 자산을 선택하세요.");
                return;
            }

            var oModel = this.getView().getModel();
            var oView  = this.getView();

            // 활성 엔티티만 _AssetHist Belnr 선검증 (드래프트는 전표 불가 → skip)
            var aChecks = aSelected.map(function (oItem) {
                var oCtx      = oItem.getBindingContext();
                var sAnlnr    = (oCtx.getProperty("Anlnr") || "").trim();
                var bIsActive = oCtx.getProperty("IsActiveEntity");

                if (!bIsActive) {
                    return Promise.resolve({ anlnr: sAnlnr, hasDoc: false });
                }

                var oHistBinding = oModel.bindList("_AssetHist", oCtx, null, null, {
                    $$ownRequest: true,
                    $select: "Belnr",
                    $filter: "Belnr ne ''"
                });
                return oHistBinding.requestContexts(0, 1).then(function (aCtxs) {
                    return { anlnr: sAnlnr, hasDoc: aCtxs.length > 0 };
                });
            });

            oView.setBusy(true);

            Promise.all(aChecks)
                .then(function (aResults) {
                    oView.setBusy(false);

                    var aBlocked = aResults.filter(function (r) { return r.hasDoc; });
                    if (aBlocked.length) {
                        var sNums = aBlocked.map(function (r) { return r.anlnr; }).join(", ");
                        MessageBox.error(
                            "전표가 생성된 자산(들)은 삭제할 수 없습니다. 처분 기능을 사용하세요.\n[" + sNums + "]"
                        );
                        return;
                    }

                    // 드래프트 포함 여부 체크 — 안내 문구 조정
                    var bHasDraft = aSelected.some(function (oItem) {
                        return !oItem.getBindingContext().getProperty("IsActiveEntity");
                    });

                    var sMsg = bHasDraft
                        ? aSelected.length + "건을 삭제하시겠습니까?\n(초안 포함 — 해당 초안은 폐기됩니다)"
                        : aSelected.length + "건의 자산을 삭제하시겠습니까?\n삭제 후에는 되돌릴 수 없습니다.";

                    MessageBox.confirm(sMsg, {
                        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                        emphasizedAction: MessageBox.Action.CANCEL,
                        onClose: function (sAction) {
                            if (sAction !== MessageBox.Action.OK) { return; }

                            var aPromises = aSelected.map(function (oItem) {
                                var oCtx      = oItem.getBindingContext();
                                var bIsActive = oCtx.getProperty("IsActiveEntity");

                                if (!bIsActive) {
                                    // 드래프트 → Discard 액션으로 폐기
                                    var oDiscard = oModel.bindContext(
                                        "com.sap.gateway.srvd.zrap_cl3_fi_01_srv.v0001.Discard(...)",
                                        oCtx
                                    );
                                    return oDiscard.execute("$auto");
                                } else {
                                    // 활성 엔티티 → OData DELETE
                                    return oCtx.delete("$auto");
                                }
                            });

                            Promise.all(aPromises)
                                .then(function () {
                                    MessageToast.show(aSelected.length + "건이 삭제되었습니다.");
                                    oTable.getBinding("items").refresh();
                                    oTable.removeSelections(true);
                                })
                                .catch(function (oErr) {
                                    MessageBox.error(
                                        "삭제 실패:\n" +
                                        (oErr.message || "전표가 있는 자산은 삭제할 수 없습니다.")
                                    );
                                    oTable.getBinding("items").refresh();
                                });
                        }
                    });
                })
                .catch(function () {
                    oView.setBusy(false);
                    MessageBox.error("자산 이력 조회 중 오류가 발생했습니다.");
                });
        },

        // ── 신규 자산 등록 화면으로 이동 ────────────────────
        // 자산번호 입력을 필수적으로 받은 후 RAP Draft 생성 및 상세 편집 화면으로 이동
        onCreateAsset: function () {
            var that = this;
            var oInput = new Input({
                placeholder: "예) FA00000001 (10자리)",
                maxLength: 20,
                submit: function() {
                    oDialog.getBeginButton().firePress();
                }
            });

            var oDialog = new Dialog({
                title: "자산번호 입력",
                type: "Message",
                content: [
                    new Label({ text: "등록할 자산번호를 반드시 입력하십시오.", labelFor: oInput }),
                    oInput
                ],
                beginButton: new Button({
                    type: "Emphasized",
                    text: "확인",
                    press: function () {
                        var sAnlnr = oInput.getValue().trim();
                        if (!sAnlnr) {
                            oInput.setValueState("Error");
                            oInput.setValueStateText("자산번호는 필수 입력 항목입니다.");
                            return;
                        }
                        oDialog.close();

                        // RAP Draft: POST /Asset 요청으로 신규 초안 생성 후 Detail 화면으로 이동
                        var oView = that.getView();
                        var oModel = oView.getModel();
                        var oListBinding = oModel.bindList("/Asset");
                        
                        oView.setBusy(true);
                        
                        // OData V4의 create는 Promise(created())를 반환
                        var oNewCtx = oListBinding.create({
                            Bukrs: "8282",
                            Anlnr: sAnlnr,
                            Waers: "KRW",
                            Status: "1"
                        }, true); // bSkipRefresh=true (목록 갱신 방지)

                        oNewCtx.created()
                            .then(function () {
                                MessageToast.show("자산 초안이 생성되었습니다.");
                                that.getOwnerComponent().getRouter().navTo("RouteDetail", {
                                    Bukrs: encodeURIComponent("8282"),
                                    Anlnr: encodeURIComponent(sAnlnr),
                                    IsActiveEntity: "false"
                                });
                            })
                            .catch(function (oError) {
                                MessageBox.error(
                                    "초안 생성 실패:\n" + (oError.message || "서버 오류가 발생했습니다.")
                                );
                            })
                            .finally(function () {
                                oView.setBusy(false);
                            });
                    }
                }),
                endButton: new Button({
                    text: "취소",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function() {
                    oDialog.destroy();
                }
            });

            oDialog.open();
        },

        // ── 일괄 감가상각 ──────────────────────────────────
        onBulkDepreciate: function () {
            var oTable = this.byId("assetTable");
            var aSelected = oTable.getSelectedItems();
            if (!aSelected.length) {
                MessageBox.warning("감가상각을 실행할 자산을 선택하세요.");
                return;
            }

            // RAP Draft Lock 체크: 편집 중인 초안이 있는 경우 액션 실행 불가
            var bLocked = aSelected.some(function(oItem) {
                return oItem.getBindingContext().getProperty("HasDraftEntity");
            });

            if (bLocked) {
                MessageBox.error("선택한 자산 중 편집 중인 초안이 포함되어 있습니다.\n편집 중인 내용을 저장하거나 취소한 후 다시 시도하세요.");
                return;
            }

            MessageBox.confirm(aSelected.length + "건의 자산에 감가상각을 실행하시겠습니까?", {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    var oModel = this.getView().getModel();
                    var aPromises = aSelected.map(function (oItem) {
                        var oCtx = oItem.getBindingContext();
                        return oModel.bindContext(
                            "com.sap.gateway.srvd.zrap_cl3_fi_01_srv.v0001.depreciate(...)",
                            oCtx
                        ).execute();
                    });
                    Promise.all(aPromises)
                        .then(function () {
                            MessageToast.show("감가상각이 실행되었습니다.");
                            oTable.getBinding("items").refresh();
                            oTable.removeSelections(true);
                        })
                        .catch(function (oErr) {
                            var sMsg = oErr.message;
                            if (sMsg.indexOf("423") !== -1 || sMsg.indexOf("locked") !== -1) {
                                sMsg = "해당 자산이 다른 세션이나 초안에 의해 잠겨 있어 실행할 수 없습니다.";
                            }
                            MessageBox.error("감가상각 실행 실패:\n" + sMsg);
                        });
                }.bind(this)
            });
        },

        // ── 일괄 처분 ──────────────────────────────────────
        onBulkDispose: function () {
            var oTable = this.byId("assetTable");
            var aSelected = oTable.getSelectedItems();
            if (!aSelected.length) {
                MessageBox.warning("처분 처리할 자산을 선택하세요.");
                return;
            }

            // RAP Draft Lock 체크
            var bLocked = aSelected.some(function(oItem) {
                return oItem.getBindingContext().getProperty("HasDraftEntity");
            });

            if (bLocked) {
                MessageBox.error("선택한 자산 중 편집 중인 초안이 포함되어 있습니다.\n편집 중인 내용을 저장하거나 취소한 후 다시 시도하세요.");
                return;
            }

            MessageBox.confirm(aSelected.length + "건의 자산을 처분 처리하시겠습니까?", {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.CANCEL,
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    var oModel = this.getView().getModel();
                    var aPromises = aSelected.map(function (oItem) {
                        var oCtx = oItem.getBindingContext();
                        return oModel.bindContext(
                            "com.sap.gateway.srvd.zrap_cl3_fi_01_srv.v0001.dispose(...)",
                            oCtx
                        ).execute();
                    });
                    Promise.all(aPromises)
                        .then(function () {
                            MessageToast.show("처분 처리가 완료되었습니다.");
                            oTable.getBinding("items").refresh();
                            oTable.removeSelections(true);
                        })
                        .catch(function (oErr) {
                            var sMsg = oErr.message;
                            if (sMsg.indexOf("423") !== -1 || sMsg.indexOf("locked") !== -1) {
                                sMsg = "해당 자산이 다른 세션이나 초안에 의해 잠겨 있어 실행할 수 없습니다.";
                            }
                            MessageBox.error("처분 처리 실패:\n" + sMsg);
                        });
                }.bind(this)
            });
        },

        onExport: function () {
            MessageToast.show("Excel 다운로드를 준비합니다.");
        }
    });
});

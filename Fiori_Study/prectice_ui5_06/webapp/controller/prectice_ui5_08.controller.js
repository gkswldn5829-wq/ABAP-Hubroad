sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], (Controller,History) => {
    "use strict";

    return Controller.extend("code.cl3.precticeui506.controller.prectice_ui5_08", {
        onInit() {
            this.getOwnerComponent().getRouter().getRoute("Routeprectice_ui5_08").attachPatternMatched(this.onCunnection,this);
        },
        onCunnection(oEvent){
            //파라미터 밸류
            var vCarrid = oEvent.getParameter("arguments").Carrid;
            var vConnid = oEvent.getParameter("arguments").Connid;

            this.getView().byId("rCarrid").setValue(vCarrid);
            this.getView().byId("rConnid").setValue(vConnid);
        },
        onBack(){
            const oHistory = History.getInstance();
			const sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				const oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("Routeprectice_ui5_07", {}, true);
			}
        }
    });
});
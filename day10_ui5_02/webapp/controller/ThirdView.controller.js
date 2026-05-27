sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], (Controller,History) => {
    "use strict";

    return Controller.extend("code.cl3.day10ui502.controller.ThirdView", {
        onInit() {
        },

        goFirst(){
            this.getOwnerComponent().getRouter().navTo("Routeday10_ui5_02");
			
        },
        goSecond(){
            this.getOwnerComponent().getRouter().navTo("RoutesecondView");
        },
        onNavBack() {
			const oHistory = History.getInstance();
			const sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				const oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("overview", {}, true);
			}
		}
    });
});
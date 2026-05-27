sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.cl3.day10ui502.controller.day10_ui5_02", {
        onInit() {
        },

        goSecond(){
            const oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("RoutesecondView");
        },
        goThird(){
            this.getOwnerComponent().getRouter().navTo("RouteThirdView")
        }
    });
});
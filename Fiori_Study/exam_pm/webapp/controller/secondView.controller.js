sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], (Controller,JSONModel,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.exampm.controller.secondView", {
        onInit() {   
        },
        goThird(){
            const oRouter = this.getOwnerComponent().getRouter(); 
			oRouter.navTo("RouteThirdView"); //세번째 경로로 갈 수 있는 코드 + 세번째 경로 사이트 
        }
    });
});
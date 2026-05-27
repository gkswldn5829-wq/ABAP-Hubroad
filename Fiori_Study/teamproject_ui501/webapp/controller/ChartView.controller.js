sap.ui.define([
     "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel"
], (Controller, ODataModel, Filter, FilterOperator,JSONModel) => {
    "use strict";

    return Controller.extend("code.cl3.teamprojectui501.controller.ThirdView", {

        onInit() {

            //Add other service
            var oModel = new ODataModel("/sap/opu/odata/sap/ZGWCODE_CL301_SRV/");
            var oModel1 = new ODataModel("/sap/opu/odata/sap/ZGWCODE_CL302_SRV/")
            var oModel2 = new JSONModel("/json/airline.json");

            this.getView().setModel(oModel, "flight");
            this.getView().setModel(oModel1, "Payment");
            this.getView().setModel(oModel2, "sales");

        }
    });
});
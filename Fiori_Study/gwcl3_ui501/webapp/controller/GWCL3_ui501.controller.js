sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller,ODataModel,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.gwcl3ui501.controller.GWCL3_ui501", {
        onInit() {
            let oModel = new ODataModel("/sap/opu/odata/sap/ZGWCODE_CL302_SRV/");
            this.getView().setModel(oModel,"server1");
        }
    });
});
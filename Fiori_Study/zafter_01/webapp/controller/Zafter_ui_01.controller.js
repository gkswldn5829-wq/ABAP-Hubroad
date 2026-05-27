sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], (Controller, ODataModel,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("zcl327.zafter01.controller.Zafter_ui_01", {
        onInit() {
            // var oModel = new ODataModel("/sap/opu/odata/sap/ZCL3_27_21_DDL_CDS/");
            // this.getView().setModel(oModel, "Chart");
        }
    });
});
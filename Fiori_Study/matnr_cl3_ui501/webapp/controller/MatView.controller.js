sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel"
], (Controller,ODataModel) => {
    "use strict";

    return Controller.extend("cl3.mat.matnrcl3ui501.controller.MatView", {
        onInit() {
             var oModel = new ODataModel("/sap/opu/odata/sap/ZCL3_25_16_DDL_CDS");
             this.getView().setModel(oModel, "mat");
        }
    });
});
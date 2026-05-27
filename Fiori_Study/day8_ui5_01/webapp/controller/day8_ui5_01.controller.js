sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], (Controller,JSONModel,MessageToast) => {
    "use strict";

    return Controller.extend("code.cl3.day8ui501.controller.day8_ui5_01", {
        onInit() {
            let move, second, third
            move = new JSONModel("/제이슨/json.json");
             this.getView().setModel(move,"server1");
            second = new JSONModel("/제이슨/Old.json")
            this.getView().setModel(second,"server2");
            third = new JSONModel("/제이슨/후로핏.json");
            this.getView().setModel(third,"server3");
        }
    });
});
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller,MessageToast) => {
    "use strict";

    return Controller.extend("academycl3.day1mk2.controller.Day1_mk2", {
        onInit() {
        },

        onpress() {

        let vtext
        vtext=this.getView().byId("text").getValue()
        }
        
    });
});
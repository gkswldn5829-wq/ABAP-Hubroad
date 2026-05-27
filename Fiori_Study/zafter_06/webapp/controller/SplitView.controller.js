sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("zcl327.zafter06.controller.SplitView", {
        onInit() {
        },
        onPress: function(oEvent){  
            let oData = oEvent.getSource().getBindingContext().getObject(); // 선택한 행의 데이터를 가져옴

            let oBinding = this.getView().byId("spfli").getBinding("rows"); // ID가 spfli인 테이블의 행 바인딩을 가져옴

            let aFilter = [];

            aFilter.push(new Filter("Carrid", FilterOperator.EQ, oData.Carrid));
            
            oBinding.filter(aFilter);
        },
        _onsflight: function (oEvent) {
            var oData = oEvent.getParameter("rowBindingContext").getObject(); // 선택한 행의 데이터를 가져옴
            // var oData = oEvent.getSource().getBindingContext().getObject(); // 선택한 행의 데이터를 가져옴

            let oBinding = this.getView().byId("sflight").getBinding("rows"); // ID가 sflight인 테이블의 행 바인딩을 가져옴

            let aFilter = [];

            aFilter.push(new Filter("Carrid", FilterOperator.EQ, oData.Carrid));
            aFilter.push(new Filter("Connid", FilterOperator.EQ, oData.Connid));

            oBinding.filter(aFilter);

        },
        get onsflight() {
            return this._onsflight;
        },
        set onsflight(value) {
            this._onsflight = value;
        },
        
    });
});
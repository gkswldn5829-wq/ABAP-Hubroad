sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller,ODataModel,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.precticeui505.controller.prectice_ui5_05", {
        onInit() {
            let oModel = new ODataModel("/sap/opu/odata/sap/ZGWCODE_CL301_SRV/"); //제이슨파일 경로를 임폴트 하듯 oDataModel로 새로운 서비스를 감싸 생성한다.
            this.getView().setModel(oModel,"server2");
            let oData2 = new ODataModel("/sap/opu/odata/sap/ZGWCODE_CL302_SRV/");
            this.getView().setModel(oData2,"server3");
        },
        onSearch(E){
            let OnSearch = [];
            let filter = E.getParameter("query");
            if(filter){
                OnSearch.push(new Filter("Carrname",FilterOperator.Contains,filter));
            }
            this.getView().byId("table1").getBinding("rows").filter(OnSearch);
            
        },
        onSearch2(){
            let Input1, Input2, array = [];
            Input1 = this.getView().byId("input1").getValue();
            Input2 = this.getView().byId("input2").getValue();

            if(Input1!==''){
                array.push(new Filter("Carrid",FilterOperator.EQ,Input1));
            }
            if(Input2!==''){
                array.push(new Filter("Connid",FilterOperator.EQ,Input2));
            }
            if(array.length>0){
                this.getView().byId("table3").getBinding("rows").filter(array);
            }
            if(array.length==0){
                this.getView().byId("table3").getBinding("rows").filter(array);
            }
            console.log("onSearch");
        },
        onSearch3(E){
            let OnSearch = [];
            let filter = E.getParameter("query");
            if(filter){
                OnSearch.push(new Filter("Connid",FilterOperator.EQ,filter));
            }
            this.getView().byId("table4").getBinding("rows").filter(OnSearch);
        }
    });
});
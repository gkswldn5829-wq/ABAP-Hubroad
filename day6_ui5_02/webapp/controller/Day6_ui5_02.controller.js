sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller,JSONModel) => {
    "use strict";

    return Controller.extend("code.cl3.day6ui502.controller.Day6_ui5_02", {
        onInit() {
            let V, D
            V = new JSONModel("/제이슨/json.json"); //제이슨 이라는 이름으로 저장된 폴더에서 json형식으로 만든 폴더 불러오는 코드
            this.getView().setModel(V,"name1"); //해당 json 데이터를 뷰로 호출하기 위한 코드
            D = new JSONModel("/제이슨/json.json");
            this.getView().setModel(D,"name4");
        },
        onPress(){
            let B
            B = new JSONModel("/제이슨/json.json");
            this.getView().setModel(B,"name2");
            let C
            C = new JSONModel("/제이슨/json.json");
            this.getView().setModel(B,"name3");
            
        }
    });
});
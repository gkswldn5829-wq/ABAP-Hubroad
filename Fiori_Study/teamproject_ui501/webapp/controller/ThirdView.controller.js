sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/m/MessageToast"
], (Controller, Filter, FilterOperator, ODataModel, MessageToast) => {
    "use strict";

    return Controller.extend("code.cl3.teamprojectui501.controller.ThirdView", {

        onInit() {

            // ✅ 모델 생성
            const oModel = new ODataModel("/sap/opu/odata/sap/ZGWCODE_CL302_SRV/");
            this.getView().setModel(oModel, "flight");

            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteThirdView").attachPatternMatched(this._onObjectMatched, this);
            console.log("✅ ThirdView 수신 데이터:");

        },
         _onObjectMatched(oEvent) {
      // 전달받은 파라미터
      const oArgs = oEvent.getParameter("arguments");
      console.log("✅ ThirdView 수신 데이터:");

      // 뷰 로드가 끝난 후 값 세팅 (렌더링 문제 방지)
      setTimeout(() => {
        this._setInputValues(oArgs);
      }, 200);
    },

    _setInputValues(oArgs) {
      // decodeURIComponent로 디코딩 후 값 세팅
      try {
        this.byId("Carrid").setValue(decodeURIComponent(oArgs.Carrid || ""));
        this.byId("Connid").setValue(decodeURIComponent(oArgs.Connid || ""));
        this.byId("Fldate").setValue(decodeURIComponent(oArgs.Fldate || ""));
        this.byId("Price").setValue(decodeURIComponent(oArgs.Price || ""));
        this.byId("Currency").setValue(decodeURIComponent(oArgs.Currency || ""));
        this.byId("Planetype").setValue(decodeURIComponent(oArgs.Planetype || ""));

        console.log("✅ ThirdView Input 값 세팅 완료");
      } catch (e) {
        console.error("❌ Input 값 세팅 중 오류:", e);
      }
    }
    });
});
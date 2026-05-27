sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/m/MessageToast"
], (Controller, Filter, FilterOperator, ODataModel, MessageToast) => {
    "use strict";

    return Controller.extend("code.cl3.teamprojectui501.controller.FlightView", {

        onInit() {
            // ✅ 모델 생성
            const oModel = new ODataModel("/sap/opu/odata/sap/ZGWCODE_CL302_SRV/");
            this.getView().setModel(oModel, "flight");

            // ✅ 라우터 설정
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteFlightView").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched(oEvent) {
            const sCarrid = oEvent.getParameter("arguments").Carrid;
            console.log("✈️ Carrid 수신:", sCarrid);

            // 모델과 테이블 가져오기
            const oModel = this.getView().getModel("flight");
            const oTable = this.byId("flightTable");

            // ✅ 모델 로드 완료 시점에 한 번만 필터 적용
            oModel.attachEventOnce("requestCompleted", () => {
                const oBinding = oTable.getBinding("rows");
                if (oBinding) {
                    const aFilter = [new Filter("Carrid", FilterOperator.EQ, sCarrid)];
                    oBinding.filter(aFilter);
                    console.log("✅ Carrid 필터 적용 완료:", sCarrid);
                } else {
                    console.warn("⚠️ 바인딩을 찾을 수 없습니다. 테이블 ID 확인 필요");
                }
            });

            // 강제로 데이터 로드 트리거 (필터 전에 모델 fetch 보장)
            oModel.read("/FlightSet", {
                success: () => console.log("📡 FlightSet 로드 성공"),
                error: (e) => console.error("❌ FlightSet 로드 실패", e)
            });
        },
        _applyFilter() {
            const oTable = this.byId("flightTable");
            const oBinding = oTable.getBinding("rows");
            const oNoDataText = this.byId("noDataMsg");

            if (!oBinding) return;

            const aFilter = [new sap.ui.model.Filter("Carrid", sap.ui.model.FilterOperator.EQ, this._sCarrid)];
            oBinding.filter(aFilter);

            oBinding.attachDataReceived((oEvent) => {
                const oData = oEvent.getParameter("data");
                const bHasData = oData && oData.results && oData.results.length > 0;
                oNoDataText.setVisible(!bHasData);
            });
        },

        onPress(){
            const oTable = this.byId("flightTable");
            const iIndex = oTable.getSelectedIndex();

            if (iIndex === -1) {
                MessageToast.show("항공편을 선택하세요.");
                return;
            }

            const oData = oTable.getContextByIndex(iIndex).getObject();

            // 선택된 데이터 콘솔 출력
            console.log("선택한 데이터:", oData);

            const oRouter = this.getOwnerComponent().getRouter();

            // 여러 속성값 전달
            oRouter.navTo("RouteThirdView", {
                Carrid: encodeURIComponent(oData.Carrid),
                Connid: encodeURIComponent(oData.Connid),
                Fldate: encodeURIComponent(oData.Fldate),
                Price:  encodeURIComponent(oData.Price),
                Currency: encodeURIComponent(oData.Currency),
                Planetype: encodeURIComponent(oData.Planetype)
            });
        }

    });
});
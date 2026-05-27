sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/odata/v2/ODataModel"
], (Controller, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.teamprojectui501.controller.airlineView", {
        onInit() {


        },
        onGoSchedule(oEvent) {
            // 1️⃣ 현재 클릭된 Row의 Carrid 가져오기
            const oContext = oEvent.getSource().getBindingContext();
            const sCarrid = oContext ? oContext.getProperty("Carrid") : null;

            if (!sCarrid) {
                sap.m.MessageToast.show("⚠️ Carrid 값을 찾을 수 없습니다.");
                return;
            }

            console.log("✈ Carrid:", sCarrid);

            // 2️⃣ ZGWCODE_CL302_SRV ODataModel 인스턴스 생성
            const oModel2 = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZGWCODE_CL302_SRV/");

            // 3️⃣ FlightSet에서 Carrid로 데이터 존재 확인
            oModel2.read("/FlightSet", {
                filters: [
                    new sap.ui.model.Filter("Carrid", sap.ui.model.FilterOperator.EQ, sCarrid)
                ],
                success: (oData) => {
                    if (oData.results && oData.results.length > 0) {
                        // ✅ 데이터가 존재하면 다음 페이지로 이동
                        const oRouter = this.getOwnerComponent().getRouter();
                        oRouter.navTo("RouteFlightView", { Carrid: sCarrid });
                    } else {
                        // ❌ 데이터가 없을 경우 Toast 표시
                        sap.m.MessageToast.show(`항공사 ${sCarrid}의 데이터가 없습니다.`);
                    }
                },
                error: (oError) => {
                    console.error("❌ OData 조회 오류:", oError);
                    sap.m.MessageToast.show("데이터 조회 중 오류가 발생했습니다.");
                },
        // onSearch(oEvent) {
           
        //     var aFilter = [];

            
        //     var vCond = oEvent.getParameter("query");


            
        //     if (vCond) {
            
        //         aFilter.push(new Filter("Carrname", FilterOperator.Contains, vCond));
        //     }
            
        //     const oTable = this.byId("airline3");

           
        //     const oBind = oTable.getBinding("rows");

            
        //     oBind.filter(aFilter);

            
        // }
            });
        }
    });
});
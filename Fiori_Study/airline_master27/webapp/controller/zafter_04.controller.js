sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("zcl327.airlinemaster27.controller.zafter_04", {
        onInit() {
        },
        onDisplay: function () {

            var oTable = this.getView().byId("Table"); // 테이블 아이디로 테이블 객체 가져오기
            let aIndex = oTable.getSelectedIndices(), // 선택된 행의 인덱스 가져오기
                oData = oTable.getContextByIndex(aIndex[0]).getObject(), // 선택된 행의 인덱스를 이용하여 해당 행의 데이터를 가져오기
                oModel = this.getView().getModel(); // 모델 가져오기

            console.log(oModel); // oData 어떻게 담아오는지 찍어보기

            oModel.read("/AirlineSet('" + oData.Carrid + "')", 
            { 
                success: function (oReturn) {
                    this.getView().byId("Carrid").setValue(oReturn.Carrid);
                    this.getView().byId("Carrname").setValue(oReturn.Carrname);
                    this.getView().byId("Currcode").setValue(oReturn.Currcode);
                    this.getView().byId("Url").setValue(oReturn.Url);
                }.bind(this), // success 콜백 함수에서 this가 컨트롤러를 가리키도록 바인딩
                error: function () {
                    MessageToast.show("데이터를 가져오는 데 실패했습니다.");}
            }
            )    
        },
        onCreate: function () {
            let oModel = this.getView().getModel(); // 모델 가져오기
            let oEntry = { // 새로 생성할 데이터 객체
                Carrid: this.getView().byId("Carrid").getValue(),     // 입력 필드에서 Carrid 값 가져오기
                Carrname: this.getView().byId("Carrname").getValue(), // 입력 필드에서 Carrname 값 가져오기
                Currcode: this.getView().byId("Currcode").getValue(), // 입력 필드에서 Currcode 값 가져오기
                Url: this.getView().byId("Url").getValue()                // 입력 필드에서 Url 값 가져오기
            };
            oModel.create("/AirlineSet", oEntry, { // AirlineSet 엔티티셋에 oEntry 객체를 생성
                success: function () {
                    MessageToast.show("항공사 데이터가 생성되었습니다."); 
                    this.getView().byId("Carrid").setValue(""); // 입력 필드 초기화
                    this.getView().byId("Carrname").setValue(""); 
                    this.getView().byId("Currcode").setValue("");
                    this.getView().byId("Url").setValue("");
                }.bind(this),
                error: function () {
                    MessageToast.show("항공사 데이터 생성에 실패했습니다.");
                }

            });
        },
        onUpdate: function () {
            let oModel = this.getView().getModel(); // 모델 가져오기

            var vCarrid = this.getView().byId("Carrid").getValue(); // 업데이트할 항공사 ID(pk) 가져오기
                
            let oEntry = { // 업데이트할 데이터 객체
                Carrname: this.getView().byId("Carrname").getValue(), // 입력 필드에서 Carrname 값 가져오기
                Currcode: this.getView().byId("Currcode").getValue(), // 입력 필드에서 Currcode 값 가져오기
                Url: this.getView().byId("Url").getValue()            
            };

            oModel.update("/AirlineSet('" + vCarrid + "')", oEntry, { // AirlineSet 엔티티셋에서 Carrid가 vCarrid인 항목을 oEntry 객체로 업데이트
                success: function () {
                    oModel.refresh(); // 모델 새로고침하여 변경된 데이터 반영
                    MessageToast.show("항공사 데이터가 업데이트되었습니다.");
                    this.getView().byId("Carrid").setValue(""); // 입력 필드 초기화
                    this.getView().byId("Carrname").setValue(""); 
                    this.getView().byId("Currcode").setValue("");
                    this.getView().byId("Url").setValue("");
                },
                error: function () {
                    MessageToast.show("항공사 데이터 업데이트에 실패했습니다.");
                }
                }
            );
        },
        onDelete: function () {
            let oModel = this.getView().getModel(); // 모델 가져오기
            let aIndex = this.getView().byId("Table").getSelectedIndices(); // 선택된 행의 인덱스 가져오기

            if (aIndex < 1) {
                MessageToast.show("삭제할 항공사를 선택해주세요.");
                return;
            }

            var oEntry = this.getView().byId("Carrid").getValue(); // 삭제할 항공사 ID(pk) 가져오기

            oModel.remove("/AirlineSet('" + oEntry + "')", { // AirlineSet 엔티티셋에서 Carrid가 oEntry인 항목 삭제
                success: function () {
                    oModel.refresh(); // 모델 새로고침하여 변경된 데이터 반영
                    MessageToast.show("항공사 데이터가 삭제되었습니다.");
                    this.getView().byId("Carrid").setValue(""); // 입력 필드 초기화
                    this.getView().byId("Carrname").setValue(""); 
                    this.getView().byId("Currcode").setValue("");
                    this.getView().byId("Url").setValue("");
                }.bind(this),
                error: function () {
                    MessageToast.show("항공사 데이터 삭제에 실패했습니다.");
                }
                }
            );
            
        },
        onDelete2: function () { 
            let oModel = this.getView().getModel(); // 모델 가져오기
            let aIndex = this.getView().byId("Table").getSelectedIndices(); // 선택된 행의 인덱스 가져오기

            if (aIndex < 1) {
                MessageToast.show("삭제할 항공사를 선택해주세요.");
                return;
            }

            var oEntry = this.getView().byId("Table").getContextByIndex(aIndex[0]).getObject(); // 선택된 행의 Carrid 가져오기

            oModel.remove("/AirlineSet('" + oEntry.Carrid + "')", { // AirlineSet 엔티티셋에서 Carrid가 oEntry인 항목 삭제
                success: function () {
                    oModel.refresh(); // 모델 새로고침하여 변경된 데이터 반영
                    MessageToast.show("항공사 데이터가 삭제되었습니다.");
                    this.getView().byId("Carrid").setValue(""); // 입력 필드 초기화
                    this.getView().byId("Carrname").setValue(""); 
                    this.getView().byId("Currcode").setValue("");
                    this.getView().byId("Url").setValue("");
                }.bind(this),
                error: function () {
                    MessageToast.show("항공사 데이터 삭제에 실패했습니다.");
                }
                }
            );
        }
    });
});
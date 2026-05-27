var aData = ["ALPHA", "BRAVO", "CHARLIE", "DELTA"];
let aAirline = ["AA", "KA", "LH", "DL", "QA"]

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller,MessageToast) => {
    "use strict";

    return Controller.extend("codecl3.day5ui01.controller.Day5_UI501", {
        onInit() {
        },
        vCreat(){
            let C 
            C = this.getView().byId("input").getValue(); //뷰의 인풋으로 부터 컨트롤러에 값을 가져옴
                    aData.push(C) //배열에 입력받은 값을 추가함
                this.getView().byId("input2").setValue(aData); //푸쉬 받은 배열을 인풋2에 호출해서 나타냄
                    console.log(aData);
        },
        vDelete(){
            let D
            D = this.getView().byId("input").getValue();
            
                for(let dd in aData){ //for문으로 aData의 인덱스를 순회
                    if(D==aData[dd]){ //dd가 aData라는 배열을 순회하는 인덱스의 값을 D와 같은지 비교하라는 이프문
                    aData.splice(dd,1); //배열에 splice걸어서 (인덱스자리,1개삭제)
                    break;
                    }
                }
            this.getView().byId("input2").setValue(aData);
            console.log(aData);
        },

        vSearch(){
            let D
            D = this.getView().byId("input").getValue();
            let flag=0;
        
            for(let dd in aData){ 
                if(D==aData[dd]){
                    this.getView().byId("input2").setValue(D);
                    flag=1;
                    break;
                }

            }
            if(flag==0){
                MessageToast.show("Data not found")
            }
        },
        
        onPress(){
            let O
            O = this.getView().byId("text3").getValue();
                for(let Z of aAirline){
                    if(O=="KA"){
                        console.log("Korea Air");
                        MessageToast.show("Korea Air");
                        break;
                    }else if(O=="DL"){
                        console.log("Delta Air");
                        MessageToast.show("Delta Air");
                        break;
                    }else if(O=="QA"){
                        console.log("Qatar Air");
                        MessageToast.show("Qatar Air");
                        break;
                    }else{
                        MessageToast.show("un match")
                        break;
                    }
                }

        },
        onPress2(){
            let B
             B = this.getView().byId("text4").getValue();
                    switch (B) {
                        case "AA":
                            console.log("Amercan Air");
                            MessageToast.show("Amercan Air");
                            break;
                        case "LH":
                            console.log("Luft Hansa");
                            MessageToast.show("Luft Hansa");
                            break;
                        default:
                            console.log("Etc");
                            MessageToast.show("Etc");
                            break;
                    }
        },
        onButton(){
            let ID, PW, ID2 = "뚤랄리딸랄리", PW2 ="1234" ;
            
                ID=this.getView().byId("ID").getValue();
                PW=this.getView().byId("PW").getValue();
         
               if(ID == ID2 && PW== PW2){
                    MessageToast.show(ID+"님 반갑습니다.")
                }else if(ID!==ID2){
                    MessageToast.show("ID가 틀렸습니다.")
                }else if(PW!==PW2){
                    MessageToast.show("PW가 틀렸습니다.")
                }
        }
    });
});
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller,MessageToast) => {
    "use strict";

    return Controller.extend("codecl3.day3ui501.controller.Day3UI501", {
        onInit() {
            // var gt_kostl = [
            //     {
            //         Kostl: "KS1770",
            //         Ktext: "Chemical manage"
            //     },

            //     {
            //         Kostl: "KS1880",
            //         Ktext: "Natural manage"
            //     }
            // ];
            //     for(let k of gt_kostl){
            //     console.log(k);
            //     }
            //     for(let k in gt_kostl){
            //     console.log(k+"번째 속성"+"kostl의 키값은"+gt_kostl[k]["Kostl"]+"입니다.");
            //     console.log(k+"번째 속성"+"ktext의 키값은"+gt_kostl[k]["Ktext"]+"입니다.");
            //     }
            // var gt_prctr = [
            //     {
            //         Prctr: "PR001",
            //         Gtext: "Jongro center"
            //     },
            //     {
            //         Prctr: "PR002",
            //         Gtext: "Songpa center"
            //     }
            // ];
            //     for(let p in gt_prctr)
            //     console.log(p);
            //     for(let p of gt_prctr)
            //     console.log(p);

            // var gt_data = ["Apple", "Banana", "Carrot"];
            //     for(let d of gt_data)
            //     console.log("gt_data의 값은"+d+"입니다.");
            //     for(let d in gt_data)
            //     console.log("gt_data의 속성은"+d+"입니다.");

            // var gs_object = {
            //     City: "Seoul",
            //     Zone: "Jongro",
            //     Post: "777"
            // };
            //     for(let o in gs_object)
            //     console.log(gs_object[o]);
            //     for(let o in gs_object)
            //     console.log(o);

            //while 구문
            let w=2
                while(w<=2){
                    let w2=1
                        while(w2<=9){
                            console.log(w+"x"+w2+"="+w*w2)
                            w2++
                        }
                    console.log("-------------------")
                    w++
                }

        },
        onButton(){
            let number
            number=parseInt(this.getView().byId("text2").getValue());
            if(2<=number&&number<=9){
                let g=1    
                while(g<=9){
                    console.log(number+"x"+"="+number*g)
                g++
                }
            } 
            else{
                MessageToast.show("2~9사이의 정수를 입력해주세요")
            }
        },

        onDo(){
            let baba
            baba=parseInt(this.getView().byId("do").getValue());
            if(2<=baba&&baba<=9){
            let B =1
                do{
                    console.log(baba+"x"+"="+baba*B)
                    B++
                } while(B<=9);
            }   else{
                MessageToast.show("2와9사이의 정수를 입력해주세요")
                }

        },
        onChange(){
            var vIcon;
            vIcon=this.getView().byId("btrl").getText(); //VIew의 Text로부터 데이터를 get 한다.

            if(vIcon=="save"){ //만약 내가 가져온 아이콘의 텍스트가 save라고 한다면! =>조건식
                this.getView().byId("btrl").setText("button");
                this.getView().byId("btrl").setIcon("sap-icon://accept");
            }else{
                this.getView().byId("btrl").setText("save"); //만약 버튼에 세이브라는 텍스트가 없다면 세이브라는 텍스트를 내보내라
                this.getView().byId("btrl").setIcon("sap-icon://add");
            }

           // 버튼의 텍스트를 바꾼다.
            
        },
        // onChange(){ //버튼을 누를 때마다 버튼의 텍스트가 바뀌는 버튼
        //     let vText
        //     vText=this.getView().byId("btrl").getText();
        //     switch (vText) {
        //         case "Button":
        //             vText="Save"
        //             break;
            
        //         default:
        //             vText="Button"
        //             break;
        //     }
        //     this.getView().byId("btrl").setText(vText);
        // }

    });
});
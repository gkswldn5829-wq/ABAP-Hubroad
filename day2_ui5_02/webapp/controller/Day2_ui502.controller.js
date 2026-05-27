sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("codecl3.day2ui502.controller.Day2_ui502", {
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
            //     for(let k of gt_kostl)
            //     console.log(k);
            //     for(let k in gt_kostl)
            //     console.log(k);

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
            //     for(let p of gt_prctr)
            //     console.log(p);
            //     for(let p in gt_prctr)
            //     console.log(p);

            // var gt_data = ["Apple", "Banana", "Carrot"];
            //     for(let d of gt_data)
            //     console.log(d);
            //     for(let d in gt_data)
            //     console.log(d);

            // var gs_object = {
            //     City: "Seoul",
            //     Zone: "Jongro",
            //     Post: "777"
            // };
            //     for(let o in gs_object)
            //     console.log(gs_object[o]);
            //     for(let o in gs_object)
            //     console.log(o);
            
            // let i = 2 //초기문
            //     while(i <= 9){  //반복 조건
            //         let j = 1 // 안쪽 초기문
            //             while(j<=9){ // 안쪽 반복조건 
            //                 console.log(i+"x"+j+"="+i*j) // 안쪽 반복될 코드
            //                 j++ // 안쪽 증가문
            //             } //반복될코드
            //         console.log("----------------") 
            //         i++ // 증가문
            //     }
            


            // for (let i = 2; i < 10; i++) {
            //     for (let j = 1; j < 10; j++) {
            //         console.log(i + "x" + j + "=" + i * j)
            //     }
            //     console.log("-----------------------------")
            // }

        },
        vPress() {
            let vh1, vv2, vvarea;
            vh1 = parseInt(this.getView().byId("h1").getValue());
            vv2 = parseInt(this.getView().byId("v1").getValue());
            let result = vh1 * vv2
            this.getView().byId("area").setValue(result);
            MessageToast.show(result);
        },

        gugu() {
            {
                for (let i = 2; i < 10; i++) {
                    if (i % 2 == 1) {
                        for (let j = 1; j < 10; j++) {
                            // if(i%2==1){
                            console.log(i + "x" + j + "=" + i * j)
                            // } 
                        } console.log("-------------------------------------")
                    }

                }
            }
        },
        jaja(){
            for(let i=2; i<=9;i++){
                if(i%2==1){
                    for(let j=1;j<=9;j++){
                        console.log(i+"x"+j+"="+i*j)
                    }
                    console.log("--------------------")
                }
            }
        }

    });
});
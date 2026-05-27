sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], (Controller,JSONModel,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.day9ui501.controller.day9_ui5_01", {
        onInit() {
               let vData = {
                 airSet : [

                    {Carrid: "AA", Carrname: "America Air", Price: 452.05, Curkey: "USD"},
                    {Carrid: "LH", Carrname: "Lufthansa", Price: 514.52, Curkey: "EUR"},
                    {Carrid: "KO", Carrname: "대한항공",  Price: 250000, Curkey: "KRW"},
                    {Carrid: "DL", Carrname: "Delta Air", Price: 526.21, Curkey: "USD"},
                    {Carrid: "AS", Carrname: "아시아나항공", Price: 245000, Curkey: "KRW"}
                    
                    ]
                }

                var oData = {
                    chartSet : [

                        {Age:"10",Answer:"25.5", color:"Good"},
                        {Age:"20",Answer:"30.1", color:"Error"},
                        {Age:"30",Answer:"20.0", color:"Good"},
                        {Age:"40",Answer:"10.5", color:"Critical"},
                        {Age:"50",Answer:"4.9", color:"Error"},
                        {Age:"60",Answer:"9.0", color:"Good"},
                        
                    ]
                 }
            let i, B
            i = new JSONModel(oData)
            this.getView().setModel(i,"server1");
            B = new JSONModel(vData)
            this.getView().setModel(B,"server2");

        },
        filterGlobally(E) { //서치 이벤트를 실행시키기 위해 실행될 매개변수 이름을 E로 정해준다.
            //bulid filter attay,
            let aFilter = []; //검색 조건을 담을 배열을 선언한다. 여러개의 조건이 담길 수 있다.
           
            let vEvent = E.getParameter("query"); //매개변수 E를 통해 서치창에 입력될 데이터중 query를 getParameter라는 메소드로 가져와 vEvent에 담는다.
            
            if(vEvent){ //만약에 조건에 vEvent의 값이 담긴다면 (조건문)
                aFilter.push(new Filter("Carrname", FilterOperator.Contains, vEvent));//배열에 Push해서 쿼리값을 넣는다.
                // aFilter.push(new Filter("Carrid", FilterOperator.Contains, vEvent)); //new로 생성자를 사용하면 메모리에 할당되면서 생상자가 수행된다. 
            }

            //내가 규칙을 적용한 필터라는 객체를 어그레이션에 바인딩 시키는 코딩
                this.getView().byId("table").getBinding("rows").filter(aFilter)
            // var oBind = oTable.getBinding("rows");//테이블이라는 변수에 어그리게이션인 rows를 바인딩해서 얻어온다. 
            // oTable.filter(aFilter) //oTable이라는 변수를 . 필터링 해라. aFilter라는 배열에 있는 것으로   
        },
        onSearch(){
            let array = [];

           let data1 = this.getView().byId("word").getValue();
           let data2 = this.getView().byId("word2").getValue();

           if(data1 !=''){
                array.push( new Filter("Carrid",FilterOperator.EQ,data1));

           }     
           if(data2 !=''){
                array.push( new Filter("Carrname",FilterOperator.Contains,data2))
           }
           if(array.length>=0){
                this.getView().byId("table").getBinding("rows").filter(array);
           }
            
    },
        onPress(){ //연습용 프레스 버튼
            
            let D1,D2, array = [];
            
            D1 = this.getView().byId("word").getValue()
            D2 = this.getView().byId("word2").getValue()

            if(D1!==''){
                array.push(new Filter("Carrid",FilterOperator.Contains,D1))
            }
            if(D2!==''){
                array.push(new Filter("Carrname",FilterOperator.Contains,D2))
            }
            if(array.length>=0){
                this.getView().byId("table").getBinding("rows").filter(array)
            }
        }
    });
});
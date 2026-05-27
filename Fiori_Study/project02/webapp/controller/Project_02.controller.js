sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("code.cl3.project02.controller.Project_02", {
        
        onInit: function () {
            // 사용자 정보 모델
            var oUserModel = new JSONModel({
                userId: "admin@airline.com"
            });
            this.getView().setModel(oUserModel);

            // 더미 데이터 생성
            this._loadDashboardData();
            
            // 차트 초기화
            this._initCharts();
        },

        /**
         * 대시보드 데이터 로드
         */
        _loadDashboardData: function () {
            var oData = {
                // 최근 예약 현황
                recentBookings: [
                    {
                        bookingId: "BK20231101",
                        route: "ICN → NRT",
                        date: "2023-11-15",
                        status: "확정",
                        statusState: "Success"
                    },
                    {
                        bookingId: "BK20231102",
                        route: "ICN → LAX",
                        date: "2023-11-16",
                        status: "대기",
                        statusState: "Warning"
                    },
                    {
                        bookingId: "BK20231103",
                        route: "ICN → SFO",
                        date: "2023-11-17",
                        status: "확정",
                        statusState: "Success"
                    },
                    {
                        bookingId: "BK20231104",
                        route: "ICN → BKK",
                        date: "2023-11-18",
                        status: "취소",
                        statusState: "Error"
                    },
                    {
                        bookingId: "BK20231105",
                        route: "ICN → HKG",
                        date: "2023-11-19",
                        status: "확정",
                        statusState: "Success"
                    }
                ],
                
                // 운항 스케줄
                flightSchedule: [
                    {
                        flightNo: "KE001",
                        routeInfo: "ICN → LAX",
                        time: "10:30",
                        flightStatus: "정시",
                        flightStatusState: "Success"
                    },
                    {
                        flightNo: "KE002",
                        routeInfo: "ICN → NRT",
                        time: "11:45",
                        flightStatus: "탑승중",
                        flightStatusState: "Information"
                    },
                    {
                        flightNo: "KE003",
                        routeInfo: "ICN → SFO",
                        time: "13:20",
                        flightStatus: "지연",
                        flightStatusState: "Warning"
                    },
                    {
                        flightNo: "KE004",
                        routeInfo: "ICN → PVG",
                        time: "15:00",
                        flightStatus: "정시",
                        flightStatusState: "Success"
                    }
                ]
            };

            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel, "dashboard");
        },

        /**
         * 차트 초기화
         */
        _initCharts: function () {
            // Chart 1: 월별 매출 추이
            this._createRevenueChart();
            
            // Chart 2: 노선별 탑승률
            this._createRouteChart();
        },

        /**
         * 월별 매출 추이 차트
         */
        _createRevenueChart: function () {
            var oChartContainer = this.getView().byId("chartContainer1");
            
            // 더미 차트 데이터
            var aChartData = [
                { month: "1월", revenue: 85 },
                { month: "2월", revenue: 92 },
                { month: "3월", revenue: 88 },
                { month: "4월", revenue: 95 },
                { month: "5월", revenue: 103 },
                { month: "6월", revenue: 110 },
                { month: "7월", revenue: 125 },
                { month: "8월", revenue: 130 },
                { month: "9월", revenue: 115 },
                { month: "10월", revenue: 120 },
                { month: "11월", revenue: 128 },
                { month: "12월", revenue: 135 }
            ];

            // Chart.js 또는 간단한 HTML 차트로 표시
            var sChartHTML = this._generateBarChart(aChartData, "revenue");
            oChartContainer.addItem(new sap.ui.core.HTML({
                content: sChartHTML
            }));
        },

        /**
         * 노선별 탑승률 차트
         */
        _createRouteChart: function () {
            var oChartContainer = this.getView().byId("chartContainer2");
            
            var aChartData = [
                { route: "ICN-LAX", rate: 92 },
                { route: "ICN-NRT", rate: 88 },
                { route: "ICN-SFO", rate: 85 },
                { route: "ICN-BKK", rate: 95 },
                { route: "ICN-HKG", rate: 90 }
            ];

            var sChartHTML = this._generateBarChart(aChartData, "rate");
            oChartContainer.addItem(new sap.ui.core.HTML({
                content: sChartHTML
            }));
        },

        /**
         * 간단한 막대 차트 생성
         */
        _generateBarChart: function (aData, sValueField) {
            var sHTML = '<div style="padding: 20px;">';
            
            aData.forEach(function (oItem) {
                var sLabel = oItem.month || oItem.route;
                var iValue = oItem[sValueField];
                var iPercentage = (iValue / 150) * 100; // 최대값 기준 비율
                
                sHTML += '<div style="margin-bottom: 15px;">';
                sHTML += '<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">';
                sHTML += '<span style="font-weight: 500;">' + sLabel + '</span>';
                sHTML += '<span style="color: #0070f2; font-weight: 600;">' + iValue + (sValueField === "rate" ? "%" : "억") + '</span>';
                sHTML += '</div>';
                sHTML += '<div style="width: 100%; height: 24px; background: #f5f5f5; border-radius: 4px; overflow: hidden;">';
                sHTML += '<div style="width: ' + iPercentage + '%; height: 100%; background: linear-gradient(90deg, #0070f2, #005fb8); transition: width 0.3s;"></div>';
                sHTML += '</div>';
                sHTML += '</div>';
            });
            
            sHTML += '</div>';
            return sHTML;
        },

        /**
         * 로그아웃
         */
        onLogout: function () {
            MessageToast.show("로그아웃 되었습니다.");
            // 로그인 화면으로 이동
            // this.getOwnerComponent().getRouter().navTo("login");
        }
    });
});
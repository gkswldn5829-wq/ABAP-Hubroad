sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'zrapfic3.cl3fiproject0006',
            componentId: 'AssetList',
            contextPath: '/Asset'
        },
        CustomPageDefinitions
    );
});
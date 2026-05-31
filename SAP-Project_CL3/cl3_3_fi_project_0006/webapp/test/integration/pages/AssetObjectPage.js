sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'zrapfic3.cl3fiproject0006',
            componentId: 'AssetObjectPage',
            contextPath: '/Asset'
        },
        CustomPageDefinitions
    );
});
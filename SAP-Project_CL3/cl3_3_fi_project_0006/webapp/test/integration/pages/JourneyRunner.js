sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"zrapfic3/cl3fiproject0006/test/integration/pages/AssetList",
	"zrapfic3/cl3fiproject0006/test/integration/pages/AssetObjectPage",
	"zrapfic3/cl3fiproject0006/test/integration/pages/AssetHistObjectPage"
], function (JourneyRunner, AssetList, AssetObjectPage, AssetHistObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('zrapfic3/cl3fiproject0006') + '/test/flp.html#app-preview',
        pages: {
			onTheAssetList: AssetList,
			onTheAssetObjectPage: AssetObjectPage,
			onTheAssetHistObjectPage: AssetHistObjectPage
        },
        async: true
    });

    return runner;
});


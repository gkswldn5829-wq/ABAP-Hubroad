/*global QUnit*/

sap.ui.define([
	"zc3fiasset27/assetmanagement/controller/cl3_3_fi_project_0007.controller"
], function (Controller) {
	"use strict";

	QUnit.module("cl3_3_fi_project_0007 Controller");

	QUnit.test("I should test the cl3_3_fi_project_0007 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

/*global QUnit*/

sap.ui.define([
	"zcl3fi/cl33fiproject0003/controller/cl3_3_fi_project_0003.controller"
], function (Controller) {
	"use strict";

	QUnit.module("cl3_3_fi_project_0003 Controller");

	QUnit.test("I should test the cl3_3_fi_project_0003 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

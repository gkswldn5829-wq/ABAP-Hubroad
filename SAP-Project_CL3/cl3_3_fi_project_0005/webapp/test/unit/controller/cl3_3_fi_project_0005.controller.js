/*global QUnit*/

sap.ui.define([
	"zc33approval/cl33fiproject0005/controller/cl3_3_fi_project_0005.controller"
], function (Controller) {
	"use strict";

	QUnit.module("cl3_3_fi_project_0005 Controller");

	QUnit.test("I should test the cl3_3_fi_project_0005 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

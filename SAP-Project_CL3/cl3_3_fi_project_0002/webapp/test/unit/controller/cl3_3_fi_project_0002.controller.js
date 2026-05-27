/*global QUnit*/

sap.ui.define([
	"cl327ns/fiprojectmodulename/controller/cl3_3_fi_project_0002.controller"
], function (Controller) {
	"use strict";

	QUnit.module("cl3_3_fi_project_0002 Controller");

	QUnit.test("I should test the cl3_3_fi_project_0002 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

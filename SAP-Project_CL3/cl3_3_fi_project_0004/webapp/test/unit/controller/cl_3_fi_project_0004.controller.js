/*global QUnit*/

sap.ui.define([
	"zc3fijiwoohan/cl3fiproject0004/controller/cl_3_fi_project_0004.controller"
], function (Controller) {
	"use strict";

	QUnit.module("cl_3_fi_project_0004 Controller");

	QUnit.test("I should test the cl_3_fi_project_0004 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

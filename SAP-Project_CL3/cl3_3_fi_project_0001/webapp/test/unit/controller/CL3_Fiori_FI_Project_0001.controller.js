/*global QUnit*/

sap.ui.define([
	"fiisdata/cl33fiproject0001/controller/CL3_Fiori_FI_Project_0001.controller"
], function (Controller) {
	"use strict";

	QUnit.module("CL3_Fiori_FI_Project_0001 Controller");

	QUnit.test("I should test the CL3_Fiori_FI_Project_0001 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

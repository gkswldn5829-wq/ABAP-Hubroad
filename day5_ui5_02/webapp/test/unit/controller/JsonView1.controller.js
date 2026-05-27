/*global QUnit*/

sap.ui.define([
	"code/cl3/dayui502/controller/JsonView1.controller"
], function (Controller) {
	"use strict";

	QUnit.module("JsonView1 Controller");

	QUnit.test("I should test the JsonView1 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

/*global QUnit*/

sap.ui.define([
	"code/cl3/exampm/controller/exam_pm.controller"
], function (Controller) {
	"use strict";

	QUnit.module("exam_pm Controller");

	QUnit.test("I should test the exam_pm controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

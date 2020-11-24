const assert = require('assert');
const firebase = require('@firebase/testing');
const { isContext } = require('vm');

const MY_PROJECT_ID = "expense-buddy-8c526";
const myId = "user_abc";
const theirId = "user_xyz";
const myAuth = {uid: myId, email: "abc@gmail.com"};

function getFirestore(auth) {
    return firebase.initializeTestApp({projectId: MY_PROJECT_ID, auth: auth}).firestore();
}

function getAdminFirestore() {
    return firebase.initializeAdminApp({projectId: MY_PROJECT_ID}).firestore();
}

beforeEach(async () => {
    await firebase.clearFirestoreData({projectId: MY_PROJECT_ID});
});

describe("Expense Collection", () => {

    it("Can't create an expense if not logged in", async() => {
        const expId = "expense_123";
        const db = getFirestore(null);
        const testDoc = db.collection("expenses").doc(expId);
        await firebase.assertFails(testDoc.set({type: "Food"}));
    });

    it("Can't create an expense if user is logged in but not listed as user", async() => {
        const expId = "expense_123";
        const db = getFirestore(myAuth);
        const testDoc = db.collection("expenses").doc(expId);
        await firebase.assertFails(testDoc.set({users: [theirId]}));
    });

    it("Can't create an expense if user is not logged in but part of users", async() => {
        const expId = "expense_123";
        const db = getFirestore(null);
        const testDoc = db.collection("expenses").doc(expId);
        await firebase.assertFails(testDoc.set({users: [myId]}));
    });

    it("Can create an expense if user is logged in and part of users", async() => {
        const expId = "expense_123";
        const db = getFirestore(myAuth);
        const testDoc = db.collection("expenses").doc(expId);
        await firebase.assertSucceeds(testDoc.set({users: [myId]}));
    });

    it("Can't edit an expense if user is not part of users", async() => {
        const expId = "expense_123";
        const db = getFirestore(myAuth);
        const testDoc = db.collection("expenses").doc(expId);
        await firebase.assertFails(testDoc.set({users: [theirId]}));
    });

    it("Can edit an expense if user is part of users", async() => {
        const expId = "expense_123";
        const db = getFirestore(myAuth);
        const testDoc = db.collection("expenses").doc(expId);
        await firebase.assertSucceeds(testDoc.set({users: [myId]}));
    });

    it("Can't read an expense if user is not part of users", async() => {
        const admin = getAdminFirestore();
        const expId = "users_doc";
        const setupDoc = admin.collection("expenses").doc(expId);
        await setupDoc.set({users: [theirId]});

        const db = getFirestore(myAuth);
        const testRead = db.collection("expenses").doc(expId);
        await firebase.assertFails(testRead.get());
    });

    it("Can read an expense if user is part of users", async() => {
        const admin = getAdminFirestore();
        const expId = "users_doc";
        const setupDoc = admin.collection("expenses").doc(expId);
        await setupDoc.set({users: [myId]});

        const db = getFirestore(myAuth);
        const testRead = db.collection("expenses").doc(expId);
        await firebase.assertSucceeds(testRead.get());
    });

    it("Can't delete an expense that is not scoped to user", async() => {
        const admin = getAdminFirestore();
        const expId = "gobal_expense";
        const setupExp = admin.collection("expenses").doc(expId);
        await setupExp.set({users: [theirId]});

        const db = getFirestore(myAuth);
        const deleteExp = db.collection("expenses").doc(expId);
        await firebase.assertFails(deleteExp.delete());
    });

    it("Can delete an expense that is scoped to user", async() => {
        const admin = getAdminFirestore();
        const expId = "gobal_expense";
        const setupExp = admin.collection("expenses").doc(expId);
        await setupExp.set({users: [myId]});

        const db = getFirestore(myAuth);
        const deleteExp = db.collection("expenses").doc(expId);
        await firebase.assertSucceeds(deleteExp.delete());
    });

    //TODO: Can't create an expense with user other than self and linked users
})
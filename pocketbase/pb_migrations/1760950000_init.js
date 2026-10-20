/// <reference path="../pb_data/types.d.ts" />
// Collections de Pécule. Chaque enregistrement appartient à un utilisateur (`user`) :
// on ne lit, ne crée et ne modifie que les siens.

const OWN = "user = @request.auth.id";
// À la création, le champ `user` doit être l'utilisateur connecté
const CREATE_OWN = "@request.auth.id != '' && @request.body.user = @request.auth.id";
// À la modification, on ne peut pas donner l'enregistrement à quelqu'un d'autre
const UPDATE_OWN = OWN + " && (@request.body.user:isset = false || @request.body.user = @request.auth.id)";

const CATEGORIES = ["logement", "courses", "restaurants", "transport", "loisirs", "abonnements", "sante", "shopping", "autres"];

function owned(app, name, fields, indexes, rules = {}) {
    const users = app.findCollectionByNameOrId("users");
    const collection = new Collection({
        type: "base",
        name,
        listRule: OWN,
        viewRule: OWN,
        createRule: CREATE_OWN,
        updateRule: UPDATE_OWN,
        deleteRule: OWN,
        ...rules,
        fields: [
            { type: "relation", name: "user", required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
            ...fields,
            { type: "autodate", name: "created", onCreate: true },
            { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
        ],
        indexes,
    });
    app.save(collection);
}

migrate((app) => {
    owned(app, "expenses", [
        { type: "number", name: "amount", required: true, onlyInt: true, min: 1, max: 100000000 },
        { type: "date", name: "date", required: true },
        { type: "select", name: "category", required: true, maxSelect: 1, values: CATEGORIES },
        { type: "text", name: "note", max: 200 },
    ], ["CREATE INDEX idx_expenses_user_date ON expenses (user, date)"]);

    owned(app, "budgets", [
        { type: "select", name: "category", required: true, maxSelect: 1, values: CATEGORIES },
        { type: "number", name: "amount", required: true, onlyInt: true, min: 1, max: 100000000 },
    ], ["CREATE UNIQUE INDEX idx_budgets_user_category ON budgets (user, category)"]);

    owned(app, "goals", [
        { type: "text", name: "item", required: true, max: 80 },
        { type: "number", name: "price", required: true, onlyInt: true, min: 1, max: 100000000 },
        { type: "text", name: "habit", required: true, max: 80 },
        { type: "number", name: "habit_monthly", required: true, onlyInt: true, min: 1, max: 10000000 },
    ], ["CREATE UNIQUE INDEX idx_goals_user ON goals (user)"]);

    // Une réponse par jour, définitive : ni modification ni suppression
    owned(app, "challenge_answers", [
        { type: "text", name: "day", required: true, pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        { type: "text", name: "question", required: true, max: 40 },
        { type: "number", name: "choice", onlyInt: true, min: 0, max: 3 },
        { type: "bool", name: "correct" },
    ], ["CREATE UNIQUE INDEX idx_answers_user_day ON challenge_answers (user, day)"], { updateRule: null, deleteRule: null });
}, (app) => {
    for (const name of ["challenge_answers", "goals", "budgets", "expenses"]) {
        app.delete(app.findCollectionByNameOrId(name));
    }
});

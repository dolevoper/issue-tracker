if (!window.location.hash) {
    window.location.hash = "#details";
}

document.body.classList.add(window.location.hash === "#details" ? "show-details" : "show-sprint");

window.addEventListener("hashchange", () => {
    document.body.classList.toggle("show-details", window.location.hash === "#details");
    document.body.classList.toggle("show-sprint", window.location.hash === "#sprint");
});

document.querySelector("#issue-list")!.innerHTML =
    issues.map((issue) => `<li title="${issue.title}" class="ellipsis"><a href="?issueId=${issue.id}#details">${issue.title}</a></li>`).join("");

document.querySelector("#assignee")!.innerHTML =
    users.map((user) => `<option value="${user.username}">${user.username}</option>`).join("");

const currentIssueId = new URLSearchParams(window.location.search).get("issueId");
const currentIssue = issues.find((issue) => issue.id === currentIssueId);

if (!currentIssueId) {
    document.body.classList.add("no-issue-selected");
} else if (!currentIssue) {
    document.body.classList.add("issue-not-found");
} else {
    document.forms.namedItem("editIssue")!.querySelector("h3")!.textContent = currentIssue.title;
    document.forms.namedItem("editIssue")!.elements.status!.value = currentIssue.status;
    document.forms.namedItem("editIssue")!.elements.assignee!.value = currentIssue.assignee;
    document.forms.namedItem("editIssue")!.elements.storyPoints!.value = currentIssue.storyPoints.toString();
    document.forms.namedItem("editIssue")!.elements.description!.value = currentIssue.description;
}

document.forms.namedItem("editIssue")!.addEventListener("submit", (e) => {
    currentIssue!.status = (e.target as HTMLFormElement).elements.status!.value as Issue["status"];
    currentIssue!.assignee = (e.target as HTMLFormElement).elements.assignee!.value as Issue["assignee"];
    currentIssue!.storyPoints = parseInt((e.target as HTMLFormElement).elements.storyPoints!.value);
    currentIssue!.description = (e.target as HTMLFormElement).elements.description!.value;

    saveIssues();
});

function toCard(issue: Issue) {
    return `<li draggable="true" data-id="${issue.id}">
        <h4 title="${issue.title}" class="ellipsis">${issue.title}</h4>
        <div class="cluster cluster--distribute">
            <p>${issue.assignee}</p>
            <p>${issue.storyPoints}</p>
        </div>
    </li>`
}

document.querySelector("#new-column")!.innerHTML =
    issues.filter((issue) => issue.status === "New").map(toCard).join("");

document.querySelector("#in-progress-column")!.innerHTML =
    issues.filter((issue) => issue.status === "In Progress").map(toCard).join("");

document.querySelector("#done-column")!.innerHTML =
    issues.filter((issue) => issue.status === "Done").map(toCard).join("");

document.querySelector(".columns")!.addEventListener("dragstart", (e) => {
    if (!(e instanceof DragEvent) || !e.dataTransfer) {
        return;
    }

    e.dataTransfer.setData("text/plain", (e.target as Element).getAttribute("data-id")!);
});

document.querySelectorAll("#new-column, #in-progress-column, #done-column")!.forEach((column) => {
    column.addEventListener("dragover", (e) => {
        if (!(e instanceof DragEvent) || !e.dataTransfer) {
            return;
        }

        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    });

    column.addEventListener("drop", (e) => {
        if (!(e instanceof DragEvent) || !e.dataTransfer) {
            return;
        }

        e.preventDefault();

        const issueId = e.dataTransfer.getData("text/plain");
        const issue = issues.find((issue) => issue.id === issueId)!;

        issue.status = (e.target as Element).getAttribute("data-status") as Issue["status"];
        saveIssues();

        (e.target as Element).appendChild(document.querySelector(`[data-id="${issueId}"]`)!);
    });
});

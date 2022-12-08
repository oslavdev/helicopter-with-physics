import { danger, fail, warn } from "danger";

const hasFixups = danger.git.commits.reduce(
	(hasFixups, commit) =>
		hasFixups ||
		commit.message.startsWith("fixup!") ||
		commit.message.startsWith("squash!"),
	false,
);

const RELEASE_TRIGGER_REGEX = /^(feat|fix|perf)[:(]/;
const BREAKING_CHANGE_REGEX = /BREAKING CHANGE:/g;

const hasReleaseTriggers = danger.git.commits.reduce(
	(hasReleaseTriggers, commit) =>
		hasReleaseTriggers ||
		RELEASE_TRIGGER_REGEX.test(commit.message) ||
		BREAKING_CHANGE_REGEX.test(commit.message),
	false,
);

if (hasFixups) {
	fail("Sqash the commits!");
}

if (!hasReleaseTriggers) {
	warn("No release notes");
}

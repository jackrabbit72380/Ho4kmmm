class SemanticVersion {
    static regex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-.]+))?(?:\+([0-9A-Za-z-.]+))?$/;

    constructor(major = 0, minor = 0, patch = 0, prerelease = '', build = '') {
        this.major = parseInt(major);
        this.minor = parseInt(minor);
        this.patch = parseInt(patch);
        this.prerelease = prerelease;
        this.build = build;
    }

    static parse(version) {
        const match = version.match(SemanticVersion.regex);
        if (!match) {
            throw new Error(`Invalid semantic version: ${version}`);
        }

        return new SemanticVersion(...match.slice(1));
    }

    static tryParse(version) {
        try {
            return [true, SemanticVersion.parse(version)];
        } catch (err) {
            return [false];
        }
    }

    toString() {
        let versionString = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease) versionString += `-${this.prerelease}`;
        if (this.build) versionString += `+${this.build}`;
        return versionString;
    }

    compare(other) {
        if (this.major != other.major) return this.major < other.major ? -1 : 1;
        if (this.minor != other.minor) return this.minor < other.minor ? -1 : 1;
        if (this.patch != other.patch) return this.patch < other.patch ? -1 : 1;

        if (!this.prerelease && !other.prerelease) return 0;
        if (this.prerelease && !other.prerelease) return -1;
        if (!this.prerelease && other.prerelease) return 1;

        const identifiers1 = this.prerelease.split('.');
        const identifiers2 = other.prerelease.split('.');
        const maxLength = Math.min(identifiers1.length, identifiers2.length);

        for (let i = 0; i < maxLength; i++) {
            const identifier1 = identifiers1[i];
            const identifier2 = identifiers2[i];
            const cmp = SemanticVersion.compareIdentifier(identifier1, identifier2);
            if (cmp !== 0)
                return cmp < 0 ? -1 : 1;
        }
        const cmp = identifiers1.length - identifiers2.length;
        return (cmp === 0) ? 0 : ((cmp < 0) ? -1 : 1);
    }

    static compareIdentifier(a, b) {
        const aNum = !isNaN(a);
        const bNum = !isNaN(b);
        if (aNum !== bNum) return aNum ? -1 : 1;
        return aNum ? parseInt(a) - parseInt(b) : a.localeCompare(b);
    }
}
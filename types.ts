export interface JobData {
    companyName: string;
    departmentAndTitle: string;
    jobDescription: string | { [key: string]: string };
    workingConditions: string | { [key: string]: string };
    workLocation: string;
    remoteWork: string;
    passiveSmoking: string;
    jobCategory: string;
    industry: string;
    companyOverviewAndBenefits: string;
    companySize: string;
    salaryRange: string;
    requiredQualifications: string;
    preferredQualifications: string;
}

export type JobDataKey = keyof JobData;

export interface Source {
    uri: string;
    title: string;
}

export interface Delegate {
  DelegateNo: string;
  Name: string;
  Committee: string;
  Class?: string;
  Number?: string;
  [key: string]: any; // Allow for other columns
}

export interface HostMember {
  ID: string;
  Name: string;
  Department: string;
  Designation?: string; // For Post
  [key: string]: any;
}

export interface ECMember {
  ID: string;
  Name: string;
  Designation: string; // For Post
  [key: string]: any;
}

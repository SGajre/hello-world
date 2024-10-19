import { TransferResponse } from './../../models/transfer-response';

import { Inject, LOCALE_ID, OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AlertService } from '../../services/alert.service';
import { ApiService } from '../../services/api.service';
import { SpinnerService } from '../../services/spinner.service';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { Account } from '../../models/account.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TransferRequest } from '../../models/transfer-request.model';
interface LINKCREDINFO {
  companyid: string;
  user_disabled: boolean;
  user_locked: any;
  userid: string;
  under_maintenance: boolean;
  applicationName: string;
}
@Component({
  selector: 'app-balance-transfer-submit',
  templateUrl: './balance-transfer-submit.component.html',
  styleUrl: './balance-transfer-submit.component.scss'
})
export class BalanceTransferSubmitComponent implements OnInit {


  public balanceTransferForm: UntypedFormGroup;

     private accountList: string = JSON.stringify([
      
      {
        accountNumber: "6634645018",
        accountName: "Dallas Inc 152 CHK",
        currencyCode: "USD",
        bankCode: "880",
        bankName: "Citizens Bank, N.A.",
        accountType: "DD",
        bankAccountType: "Checking",
        routingNumber: "021313103"
      }
    ]);
  
  public accounts : Account[] = JSON.parse(this.accountList);
  public ssoIDArr: any[] = [];
  private ssoId: string = 'SURESHG_UATALL_MMGPS';
  private appName : string;
  public company: string = '';
  public companies: any[] = [ ];
  public ssoIdArr: any = [];
  public disableAmount = true;
  public paymentId = 1189;
  public payee = 123456789;
  public paymentDate = '8/15/2023';
  public paymentAmount = '$1000 USD';
  public fromAccount = '45445';
  public paymentType = 'Transfer';

  public fromAccountAvailableBalanceMessage: string | null;
  public toAccountAvailableBalanceMessage: string | null;

  public holidays: Date[] = [];
  public minDate: Date = new Date();
  public maxDate: Date  = this.addDays(new Date(), 1);
  showError: boolean;
  errorMessage: string;
  numberOfDays: number = 1;

  private NO_AVAILABLE_BALANCE : string = 'No Available balance';
  private AVAILABLE_BALANCE : string = 'Available balance is ';

  constructor(private formBuilder: FormBuilder,
    private modal: NgbModal,
    private alertService: AlertService,
    private spinnerService: SpinnerService,
    private apiService: ApiService,
    @Inject(LOCALE_ID) private locale: string) { }


  ngOnInit(): void {
   // this.alertService.error('message');
   
    this.getCompanyInfo();
    this.createForm();
    this.initHolidaysCalendar();
  }

  createForm(): void {
    this.balanceTransferForm = this.formBuilder.group({
      company: [this.company],
      transferFrom: ['', Validators.required],
      transferTo: ['', Validators.required],
      transferDate: [this.minDate, Validators.required],
      amount: ['', Validators.required],
      comment: ['', Validators.required]
    });
  }

  addDays(date: Date, days: number): Date {
    date.setDate(date.getDate() + days);
    console.log(date.getDate);
    return date;
}
  private getCompanyInfo: any = () => {
    const linkedcredinfo = "{\"SURESHG_UATALL_MMGPS\":{\"user_disabled\":false,\"user_locked\":\"\",\"userid\":\"TEST21.04\",\"companyid\":\"UATALL2\",\"under_maintenance\":false},\"SITCUSTAUTO2_MCITY_MMGPS\":{\"user_disabled\":false,\"user_locked\":\"\",\"userid\":\"SITCUSTAUTO2\",\"companyid\":\"MCITY\",\"under_maintenance\":false},\"KALYANIUAT_UATALL_MMGPS\":{\"user_disabled\":false,\"user_locked\":\"\",\"userid\":\"KALYANIUAT\",\"companyid\":\"UATALL\",\"under_maintenance\":false},\"universalIdDisabled\":false,\"TEST21.04_QASSO1_MMGPS\":{\"user_disabled\":false,\"user_locked\":\"\",\"userid\":\"TEST21.04\",\"companyid\":\"QASSO1\",\"under_maintenance\":false}}";
    // const getlinkCredFromSession = JSON.parse(JSON.stringify(sessionStorage.getItem('linkedCredentialInfo')));
    const getlinkCredFromSession = JSON.parse(JSON.stringify(linkedcredinfo));
    const linkCredInfo = JSON.parse(getlinkCredFromSession);
    if (linkCredInfo) {
      for (let [key, value] of Object.entries(linkCredInfo)) {
        const linkCredsValue = value as LINKCREDINFO;
        const isMMGPS = key.includes('MMGPS');
        const isCashflow = key.includes('CASHFLOW');
        const isCompanyID = linkCredsValue.companyid;
        const isNotDisabled = linkCredsValue.user_disabled === false;
        const isNotLocked = linkCredsValue.user_locked === '' || linkCredsValue.user_locked === false;
        const isUnderMaintenance = linkCredsValue.under_maintenance === false

        if (isCompanyID && isUnderMaintenance && isNotDisabled && isNotLocked && (isMMGPS || isCashflow)) {
          let appName = isMMGPS ? "accessoptima" : 'cashflow'
          linkCredsValue['applicationName'] = appName;
          this.appName = linkCredsValue['applicationName']= isMMGPS ? 'accessOPTIMA' : 'Cash Flow Essentials';
          this.ssoIDArr.push({ ssoId: key, companyId: linkCredsValue.companyid, userId: linkCredsValue.userid, applicationName: appName })
        this.companies.push(linkCredsValue.companyid);
        }
      }

      this.ssoId = this.ssoIDArr[0]['ssoId']
     this.company = this.companies[0];
    }
  }

  /**
   * Reset to default value as soon as ssoId change event trigger
   */
  resetDefaultValues() {     
    this.errorMessage = '';
    this.balanceTransferForm.get('transferFrom')?.setValue('');
    this.balanceTransferForm.get('transferFrom')?.enable();
    this.balanceTransferForm.get('transferTo')?.setValue('');    
    this.balanceTransferForm.get('transferTo')?.enable();
    this.balanceTransferForm.get('transferDate')?.setValue(this.minDate);
    this.balanceTransferForm.get('amount')?.setValue('');
    this.balanceTransferForm.get('comment')?.setValue('');
    this.toAccountAvailableBalanceMessage = '';
    this.fromAccountAvailableBalanceMessage = ''; 
    this.disableAmount = true;
  }

  /**
   * Select company and reset to default values as soon as ssoId change event trigger
   */
  onCompanyChange(): void {
    const selectedCompany = this.balanceTransferForm.get('company')?.value;
    console.log('onCompanyChange', selectedCompany);
    this.resetDefaultValues();
  }

  /**
   * Get transfer from account object upon change on dropdown and call available balance API
   */
  onFromAccountChange(): void {
    const transferFromAccount = this.balanceTransferForm.get('transferFrom')?.value;
    const transferToAccount = this.balanceTransferForm.get('transferTo')?.value;
    const requestData = {
      accountNumber: transferFromAccount.accountNumber,
      routingNumber: transferFromAccount.routingNumber,
      accountType: transferFromAccount.bankAccountType
    }
    this.fromAccountAvailableBalanceMessage = '';
    this.retrieveBalance(requestData, true);
    console.log('Selected transferFromAccount Available Balance: ' , this.fromAccountAvailableBalanceMessage);


    if (!this.checkIfValueExists(transferFromAccount) || !this.checkIfValueExists(transferToAccount)) {
      this.disableAmount = true;
    }

    if (this.checkIfValueExists(transferFromAccount) && this.checkIfValueExists(transferToAccount)) {
      this.disableAmount = false;
    }
  }

  /**
   * Get transfer to account object upon change on dropdown and call available balance API
   */
  onToAccountChange(): void {
    const transferFromAccount = this.balanceTransferForm.get('transferFrom')?.value;
    const transferToAccount = this.balanceTransferForm.get('transferTo')?.value;

    console.log('Selected transferFromAccount:', transferFromAccount);
    console.log('Selected transferToAccount:', transferToAccount);
    this.toAccountAvailableBalanceMessage = '';
    const requestData = {
      accountNumber: transferToAccount.accountNumber,
      routingNumber: transferToAccount.routingNumber,
      accountType: transferToAccount.bankAccountType
    }
    this.retrieveBalance(requestData, false);

    console.log('Selected transferToAccount Available Balance: ' , this.toAccountAvailableBalanceMessage);
    if (!this.checkIfValueExists(transferFromAccount) || !this.checkIfValueExists(transferToAccount)) {
      this.disableAmount = true;
    }

    if (this.checkIfValueExists(transferFromAccount) && this.checkIfValueExists(transferToAccount)) {
      this.disableAmount = false;
    }
  }

  /**
   * Perform data pick as user input or change any event in UI
   * @param event to capture user activity and object
   */
  onDateInput(event: MatDatepickerInputEvent<Date>): void {
    const selectedDate: Date | null = event.value;
    console.log('Selected date:', selectedDate);
  }

  /**
   * Initalize Calendar date range invoking BTL Holiday API and Set max Date
   */
  private initHolidaysCalendar: any = () => {
    this.showError = false;
    this.spinnerService.setText('Please wait...')
    this.spinnerService.showSpinner();
    this.apiService.holidayAPI(this.ssoId ).subscribe({
      next: (response: any) => {
        this.handleHolidayDatesResponse(response);
      },
      error: (error: any) => {
        this.spinnerService.hideSpinner();
        console.error(error);
         this.errorMessage = `**Unable to display accounts, please check the balances**`;
      }
    });

    this.spinnerService.hideSpinner();
  }


  private handleHolidayDatesResponse(response: any) {
    if (response.status === 200) {
      this.showError = false;
      const responseData = response.data;
      responseData?.holidays.forEach((element: any) => {
        console.log(element);
        var date = new Date(element);
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset() );
        this.holidays.push(date);
      });
      this.maxDate = this.addDays(new Date(), parseInt(responseData.forwardCutoff));
    }
    if (response.status !== 200) {
      this.showError = true;
    }
  }

   // Filter date by holidays retruned from API
   holidayFilter: (date: Date | null) => boolean =
   (date: Date | null) => {
     if (!date) {
       return false;
     }
     const day = date.getDay();
     if(day !== 0 && day !== 6){
       for( var holiday of this.holidays){
         if(this.isDatesEqual(holiday, date)){
           console.log("HolidayDate : %d :: Date : %d" , holiday.toDateString() , holiday.toDateString() )
           return false;
         }
       }
       return true;
     }
     return false;
   };
 
   private isDatesEqual(date1: Date, date2: Date) :boolean   {
     return (
       date1.getFullYear() === date2.getFullYear() &&
       date1.getMonth() === date2.getMonth() &&
       date1.getDate() === date2.getDate()
     );
   }

  retrieveBalance(data : any, isFromAccount: boolean): void {
    this.showError = false;
    this.spinnerService.setText('Please wait...')
    this.spinnerService.showSpinner(); 
    
    this.apiService.balanceAPI(data, this.ssoId ).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.showError = false;
          this.spinnerService.hideSpinner();
          console.log(response?.data?.availableBalance);
          let availableBalance = response?.data?.availableBalance ?? 0.0;      
          if(isFromAccount){
            this.fromAccountAvailableBalanceMessage = this.AVAILABLE_BALANCE + availableBalance;
          }else{
            this.toAccountAvailableBalanceMessage =  this.AVAILABLE_BALANCE + availableBalance;
          }
          console.log("Balance :: ", isFromAccount, availableBalance);
        }
       
        if (response.status !== 200) {
          this.showError = true;  
          if(isFromAccount){
            this.fromAccountAvailableBalanceMessage = this.NO_AVAILABLE_BALANCE;
          }else{
            this.toAccountAvailableBalanceMessage =  this.NO_AVAILABLE_BALANCE;
          }        
        }
      },
      error: (error: any) => {
        this.spinnerService.hideSpinner();
        console.error(error);
        this.errorMessage = `**Unable to display accounts, please check the balances**`;
      }
    });
    this.spinnerService.hideSpinner();
  }
   

  public checkIfValueExists(val: any): boolean {
    if(val == undefined || val == "") {
      return false;
    }
    return true;
  }
 
    displaySuccessMessage(data: any) {
      let message = `\n<table>
         <tr><td>ID</td> <td>: ${data.transactionId} </td></tr>
         <tr><td>From Account</td><td>: ${data.fromAccount.accountNumber} - ${data.fromAccount.accountName} </td></tr>
         <tr><td>To Account</td><td>: ${data.toAccount.accountNumber} - ${data.toAccount.accountName} </td></tr>
         <tr><td>Transfer Date</td><td>: ${data.transferDate} </td></tr>
         <tr><td>Amount</td><td>: ${data.amount} </td></tr> </table>\n`;
         this.alertService.transferSubmitted(message);
      }
  

    displaySuccessMessage1(data: any) {
      let message = `\n
         \nID : ${data.transactionId}
         \nFrom Account : ${data.fromAccount.accountNumber} - ${data.fromAccount.accountName}
         \nTo Account : ${data.toAccount.accountNumber} - ${data.toAccount.accountName} 
         \nTransfer Date : ${data.transferDate} 
         \nAmount : ${data.amount} \n\n`;
          this.alertService.transferSubmitted(message);
      }

      
  displayErrorMessage(message: any) {
    this.alertService.error(message);
  }

  onBack(): void {
    this.modal.dismissAll();
  }

  onTransfer(): void {    
    this.showError = false;
    this.spinnerService.setText('Please wait...')
    this.spinnerService.showSpinner(); 
    const data = this.transferRequestBody();
    this.apiService.intiateTransfer(data, this.ssoId ).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.showError = false;
          this.spinnerService.hideSpinner();
          console.log(response?.data);
          const transferResponse = response?.data;
          this.displaySuccessMessage(transferResponse);        
        }
       
        if (response.status !== 200) {
          this.showError = true;  
                
        }
      },
      error: (error: any) => {
        this.spinnerService.hideSpinner();
        console.error(error);
        this.errorMessage = `**Unable to display accounts, please check the balances**`;
        this.alertService.error(error.message);
      }
    });
    this.spinnerService.hideSpinner();
  }

   getAccountDetails(type: string) {
    const transferAccount: Account = this.balanceTransferForm.get(type)?.value;
    delete (transferAccount as any).routingNumber;
    delete (transferAccount as any).bankAccountType;
    return transferAccount;
  }

  private transferRequestBody(): TransferRequest {    
    const transferFromAccount = this.getAccountDetails('transferFrom');
    const transferToAccount = this.getAccountDetails('transferTo'); 
    const transferDate = this.balanceTransferForm.get('transferDate')?.value;
    const amount = this.balanceTransferForm.get('amount')?.value;
    const comment = this.balanceTransferForm.get('comment')?.value;
    return new TransferRequest(transferDate, amount, transferFromAccount, transferToAccount, comment);
  }
}



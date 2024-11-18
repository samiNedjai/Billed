/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import { ROUTES_PATH } from "../constants/routes.js";



describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));
    document.body.innerHTML = NewBillUI();
  });

  describe("When I am on NewBill Page", () => {
    test("Then the NewBill form should be displayed", () => {
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });

    test("The error message should initially be hidden", () => {
      const errorMessage = screen.getByTestId("file-error");
      expect(errorMessage.style.display).toBe("none");
    });

    test("When I upload a file with an incorrect format, an error message should be displayed", () => {
      const newBill = new NewBill({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });
      const fileInput = screen.getByTestId("file");
      const errorMessage = screen.getByTestId("file-error");
      const invalidFile = new File(["file content"], "file.txt", { type: "text/plain" });

      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      expect(errorMessage.style.display).toBe("block");
      expect(fileInput.value).toBe("");
    });

    test("When I upload a file with a correct format, no error message should be displayed", () => {
      
       const errorMessage = screen.getByTestId("file-error");
      const validFile = new File(["dummy content"], "test.jpg", { type: "image/jpeg" });
     
      const fileInput = screen.getByTestId("file");

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      expect(errorMessage.style.display).toBe("none");
    });

    test("When I submit the form with valid data, it should redirect to Bills page", () => {
      const onNavigate = (pathname) => {
        // Simule le contenu de la page Bills
        if (pathname === ROUTES_PATH["Bills"]) {
          document.body.innerHTML = "<div>Mes notes de frais</div>";
        }
      };
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
      const form = screen.getByTestId("form-new-bill");

      screen.getByTestId("expense-type").value = "Transports";
      screen.getByTestId("expense-name").value = "Vol Paris-Marseille";
      screen.getByTestId("datepicker").value = "2023-03-01";
      screen.getByTestId("amount").value = "200";
      screen.getByTestId("vat").value = "10";
      screen.getByTestId("pct").value = "20";
      screen.getByTestId("commentary").value = "Voyage d'affaires";

      fireEvent.submit(form);
      
      expect(document.body.innerHTML).toContain("Mes notes de frais");
    });

    test("When an error occurs during form submission, it should log the error", async () => {

       // Mock console.error
       const consollog = jest.fn(); // On crée une version mockée de console.error
       console.error = consollog;   // On remplace la méthode réelle par le mock

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: { bills: () => ({ update: () => Promise.reject(new Error("Erreur de mise à jour")) }) },
        localStorage: window.localStorage,
      });

      screen.getByTestId("expense-type").value = "Transports";
      screen.getByTestId("expense-name").value = "Vol Paris-Marseille";
      screen.getByTestId("datepicker").value = "2023-03-01";
      screen.getByTestId("amount").value = "200";
      screen.getByTestId("vat").value = "10";
      screen.getByTestId("pct").value = "20";
      screen.getByTestId("commentary").value = "Voyage d'affaires";

      fireEvent.submit(screen.getByTestId("form-new-bill"));

      await new Promise(process.nextTick);

      expect(consollog).toHaveBeenCalledWith(new Error("Erreur de mise à jour"));
    });

    test("updateBill should call store.bills().update with correct parameters", () => {
      const updateMock = jest.fn().mockResolvedValue({});
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: { bills: () => ({ update: updateMock }) },
        localStorage: window.localStorage,
      });

      newBill.billId = "12345";

      const billData = {
        email: "employee@test.com",
        type: "Transports",
        name: "Vol Paris-Marseille",
        amount: 200,
        date: "2023-03-01",
        vat: "10",
        pct: 20,
        commentary: "Voyage d'affaires",
        fileUrl: "https://test.com/file.jpg",
        fileName: "file.jpg",
        status: "pending",
      };

      newBill.updateBill(billData);

      expect(updateMock).toHaveBeenCalledWith({ data: JSON.stringify(billData), selector: "12345" });
    });
  });
});

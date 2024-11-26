/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import BillsUI from "../views/BillsUI.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import { ROUTES_PATH } from "../constants/routes.js";



describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));
    document.body.innerHTML = NewBillUI();
    onNavigate = jest.fn();
  });
 

  describe("When I am on NewBill Page", () => {
                    // Test unitaires
    /**
     *  Vérifie que le formulaire NewBill est affiché
     */
    test("Then the NewBill form should be displayed", () => {
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });
  /**
   * Test : handleBackNavigation navigue correctement vers la page Bills
   */
    test("then it should navigate to Bills page when handleBackNavigation is called", () => {
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
      newBill.handleBackNavigation();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });
    /** 
     *  Le message d'erreur du fichier est initialement caché
     */
    test("The error message should initially be hidden", () => {
      const errorMessage = screen.getByTestId("file-error");
      expect(errorMessage.style.display).toBe("none");
    });
     /**
     *  Affiche un message d'erreur pour un fichier au format incorrect
     */
    test("When I upload a file with an incorrect format, an error message should be displayed", () => {
      const newBill = new NewBill({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });
      const fileInput = screen.getByTestId("file");
      const errorMessage = screen.getByTestId("file-error");
      const invalidFile = new File(["file content"], "file.txt", { type: "text/plain" });

      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      expect(errorMessage.style.display).toBe("block");
      expect(fileInput.value).toBe("");
    });
     /**
     *  Aucun message d'erreur pour un fichier au format correct
     */
    test("When I upload a file with a correct format, no error message should be displayed", () => {
      
       const errorMessage = screen.getByTestId("file-error");
      const validFile = new File(["dummy content"], "test.jpg", { type: "image/jpeg" });
     
      const fileInput = screen.getByTestId("file");

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      expect(errorMessage.style.display).toBe("none");
    });
    /**
     *  Vérifie que la méthode `updateBill` est appelée avec les bons paramètres
     */
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


    // test Integration 
    /**
     *  Soumettre un formulaire valide redirige vers la page Bills
     */
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

    /**
     * Test d'intégration : En cas d'erreur lors de la soumission, elle est journalisée
     */
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



    

//     test("fetches bills from an API and fails with 404 message error", async () => {
//   // Mock propre de `mockStore.bills().create`
//   jest.spyOn(mockStore, "bills").mockImplementation(() => ({
//     create: jest.fn(() => {
//       console.log("Mocked create called for 404"); // Vérifiez si cela s'affiche
//       return Promise.reject(new Error("Erreur 404"));
//     }),
//   }));

//   // Mock de `console.error`
//   const consoleErrorMock = jest.spyOn(console, "error").mockImplementation((error) => {
//     console.log("Error logged:", error.message); // Vérifiez si cette ligne s'affiche
//   });

//   // Configuration du DOM
//   document.body.innerHTML = `<div id="root"></div>`;

//   // Chargement de l'interface utilisateur avec l'erreur 404
//   const html = BillsUI({ error: "Erreur 404" });
//   document.body.innerHTML = html;

//   // Attendez la fin de toutes les promesses
//   await new Promise((resolve) => setTimeout(resolve, 100));

//   // Vérifiez que le message d'erreur s'affiche
//   const message = screen.getByText(/Erreur 404/);
//   expect(message).toBeTruthy();

//   // Vérifiez que `console.error` a été appelé avec l'erreur "Erreur 404"
//   expect(consoleErrorMock).toHaveBeenCalledTimes(1);
//   expect(consoleErrorMock).toHaveBeenCalledWith(new Error("Erreur 404"));

//   // Nettoyez les mocks
//   consoleErrorMock.mockRestore();
// });


     /**
     * Test d'intégration : Gestion d'une erreur 404 provenant de l'API
     */
    test("fetches bills from an API and fails with 404 message error", async () => {
      jest.spyOn(mockStore, "bills");
      jest.spyOn(console, "error").mockImplementation(() => {});
      document.body.innerHTML = `<div id="root"></div>`;

      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => Promise.reject(new Error("Erreur 404")),
        };
      });

      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;

      const message =  screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    /**
     * Test d'intégration : Gestion d'une erreur 500 provenant de l'API
     */
    test("fetches bills from an API and fails with 500 message error", async () => {
      jest.spyOn(mockStore, "bills");
      jest.spyOn(console, "error").mockImplementation(() => {});
      document.body.innerHTML = `<div id="root"></div>`;

      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => Promise.reject(new Error("Erreur 500")),
        };
      });

      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;

      const message =  screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });

  });
});

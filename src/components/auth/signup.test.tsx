import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Signup from "./signup";
import { BrowserRouter } from "react-router-dom";
import * as firebaseAuth from "firebase/auth";
import * as firebaseFirestore from "firebase/firestore";
import Auth from "../api/auth.module";
import { toast } from "react-toastify";

// Mock dependencies
vi.mock("firebase/auth", async () => {
  const actual = await vi.importActual("firebase/auth");
  return {
    ...actual,
    createUserWithEmailAndPassword: vi.fn(),
  };
});

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual("firebase/firestore");
  return {
    ...actual,
    setDoc: vi.fn(),
    doc: vi.fn(),
  };
});

vi.mock("../api/firebase", () => ({
  auth: {},
  db: {},
}));

vi.mock("../api/auth.module", () => ({
  default: {
    authenticateUser: vi.fn(),
  },
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("uuid", () => ({
  v4: () => "mock-uuid",
}));

const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe("Signup Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders signup form", () => {
    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    expect(screen.getByText("Create an Account")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("First Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Last Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i })
    ).toBeInTheDocument();
  });

  test("validates required fields", async () => {
    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("First Name is required")).toBeInTheDocument();
      expect(screen.getByText("Last Name is required")).toBeInTheDocument();
      expect(screen.getAllByText("Required")).toHaveLength(3); // Email, Password, Confirm Password
    });
  });

  test("handles successful signup", async () => {
    const mockUser = {
      uid: "mock-uid",
      email: "test@example.com",
      getIdToken: vi.fn().mockResolvedValue("mock-token"),
    };
    (firebaseAuth.createUserWithEmailAndPassword as any).mockResolvedValue({
      user: mockUser,
    });

    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("First Name"), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), {
      target: { value: "password123" },
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com",
        "password123"
      );
      expect(firebaseFirestore.setDoc).toHaveBeenCalled();
      expect(Auth.authenticateUser).toHaveBeenCalledWith({
        accessToken: "mock-token",
        data: mockUser,
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Sign up successful!",
        expect.any(Object)
      );
      expect(mockedNavigate).toHaveBeenCalledWith("/home");
    });
  });
});

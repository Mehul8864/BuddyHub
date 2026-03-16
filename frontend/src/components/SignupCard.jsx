import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  InputGroup,
  HStack,
  InputRightElement,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
  Link,
} from "@chakra-ui/react";
import { useState } from "react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useSetRecoilState } from "recoil";
import authScreenAtom from "../atoms/authAtom";
import useShowToast from "../hooks/useShowToast";
import userAtom from "../atoms/userAtom";

export default function SignupCard() {
  const [showPassword, setShowPassword] = useState(false);
  const setAuthScreen = useSetRecoilState(authScreenAtom);
  const setUser = useSetRecoilState(userAtom);
  const showToast = useShowToast();

  const [inputs, setInputs] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const bg = useColorModeValue("white", "gray.700");

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());

  const validate = () => {
    const e = { name: "", username: "", email: "", password: "" };
    if (!inputs.name.trim()) e.name = "Full name is required.";
    if (!inputs.username.trim()) e.username = "Username is required.";
    if (!validateEmail(inputs.email)) e.email = "Enter a valid email.";
    if (inputs.password.length < 6)
      e.password = "Password must be at least 6 characters.";
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSignup = async () => {
    if (!validate()) {
      showToast("Validation", "Please fix the errors in the form.", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: inputs.name.trim(),
        username: inputs.username.trim().toLowerCase(),
        email: inputs.email.trim().toLowerCase(),
        password: inputs.password,
      };

      const res = await fetch("/api/users/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Try to parse JSON safely
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // non-json response
        data = { message: text || res.statusText };
      }

      if (!res.ok) {
        const errMsg = data.error || data.message || res.statusText;
        showToast("Error", errMsg, "error");
        setIsLoading(false);
        return;
      }

      // Save minimal needed info — adjust according to your API shape
      // If your API returns { user, token } prefer storing token only or use secure httpOnly cookie from server
      localStorage.setItem("user-threads", JSON.stringify(data));
      setUser(data.user ?? data); // try to set user from known shape

      showToast(
        "Success",
        (data.message && String(data.message)) || "Account created successfully.",
        "success"
      );

      // Move user to login screen (or choose to auto-login)
      setAuthScreen("login");
    } catch (error) {
      // error could be network or unexpected
      showToast("Error", String(error), "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex align={"center"} justify={"center"}>
      <Stack spacing={8} mx={"auto"} maxW={"lg"} py={12} px={6}>
        <Stack align={"center"}>
          <Heading fontSize={"4xl"} textAlign={"center"}>
            Sign up
          </Heading>
        </Stack>

        <Box rounded={"lg"} bg={bg} boxShadow={"lg"} p={8}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSignup();
            }}
          >
            <Stack spacing={4}>
              <HStack>
                <Box flex={1}>
                  <FormControl isRequired isInvalid={!!errors.name}>
                    <FormLabel>Full Name</FormLabel>
                    <Input
                      name="name"
                      type="text"
                      autoComplete="name"
                      onChange={(e) =>
                        setInputs((s) => ({ ...s, name: e.target.value }))
                      }
                      value={inputs.name}
                    />
                    <FormErrorMessage>{errors.name}</FormErrorMessage>
                  </FormControl>
                </Box>

                <Box flex={1}>
                  <FormControl isRequired isInvalid={!!errors.username}>
                    <FormLabel>Username</FormLabel>
                    <Input
                      name="username"
                      type="text"
                      autoComplete="username"
                      onChange={(e) =>
                        setInputs((s) => ({ ...s, username: e.target.value }))
                      }
                      value={inputs.username}
                    />
                    <FormErrorMessage>{errors.username}</FormErrorMessage>
                  </FormControl>
                </Box>
              </HStack>

              <FormControl isRequired isInvalid={!!errors.email}>
                <FormLabel>Email address</FormLabel>
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  onChange={(e) =>
                    setInputs((s) => ({ ...s, email: e.target.value }))
                  }
                  value={inputs.email}
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.password}>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    onChange={(e) =>
                      setInputs((s) => ({ ...s, password: e.target.value }))
                    }
                    value={inputs.password}
                  />
                  <InputRightElement h={"full"}>
                    <Button
                      variant={"ghost"}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>

              <Stack spacing={10} pt={2}>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Submitting"
                  size="lg"
                  bg={useColorModeValue("gray.600", "gray.700")}
                  color={"white"}
                  _hover={{
                    bg: useColorModeValue("gray.700", "gray.800"),
                  }}
                >
                  Sign up
                </Button>
              </Stack>

              <Stack pt={6}>
                <Text align={"center"}>
                  Already a user?{" "}
                  <Link color={"blue.400"} onClick={() => setAuthScreen("login")}>
                    Login
                  </Link>
                </Text>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Stack>
    </Flex>
  );
}
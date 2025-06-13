import {
  AutoCompleteCommandInput,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useAutocompleteSuggestions } from "@/hooks/useAutoCompleteSuggestions";
import { cn } from "@/lib/utils";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { compact, debounce } from "lodash";

export type Option = Record<"value" | "label", string> & Record<string, string>;

export type Address = {
  Full_Address?: string;
  Street?: string;
  City?: string;
  Province?: string;
  Country?: string;
  Zip_Code?: string;
};

type AddressAutoCompleteProps = {
  displayName?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onAddressSelected?: (value: Address) => void;
};

export const AddressAutoComplete = ({
  displayName,
  placeholder = "Search for an address",
  emptyMessage = "No Results Found",
  onAddressSelected,
  disabled,
  isLoading = false,
}: AddressAutoCompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string | undefined>(displayName);
  const [debouncedInputValue, setDebouncedInputValue] = useState<
    string | undefined
  >(displayName);

  useEffect(() => {
    if (displayName) {
      setDebouncedInputValue(displayName);
    }
  }, [displayName]);

  useEffect(() => {
    const updateQuery = debounce(
      () => setInputValue(debouncedInputValue),
      1000
    );
    updateQuery();
    return () => updateQuery.cancel();
  }, [debouncedInputValue]);

  const places = useMapsLibrary("places");
  const { suggestions, resetSession } = useAutocompleteSuggestions(
    inputValue ?? ""
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (!input) {
        return;
      }

      // Keep the options displayed when the user is typing
      if (!isOpen) {
        setOpen(true);
      }

      // This is not a default behaviour of the <input /> field
      if (event.key === "Enter" && input.value !== "") {
        const optionToSelect = suggestions.find(
          (option) => option.placePrediction?.text?.text === input.value
        );
        if (optionToSelect) {
          handleSuggestionClick(optionToSelect);
        }
      }

      if (event.key === "Escape") {
        input.blur();
      }
    },
    [isOpen, suggestions]
  );

  const handleBlur = useCallback(() => {
    setOpen(false);
    // setInputValue(selected?.displayName);
  }, []);

  const handleSuggestionClick = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!places) return;
      if (!suggestion.placePrediction) return;

      const place = suggestion.placePrediction.toPlace();

      await place.fetchFields({
        fields: [
          "viewport",
          "location",
          "svgIconMaskURI",
          "iconBackgroundColor",
          "addressComponents",
        ],
      });

      // calling fetchFields invalidates the session-token, so we now have to call
      // resetSession() so a new one gets created for further search
      resetSession();

      handleOptionSelection(place);

      // This is a hack to prevent the input from being focused after the user selects an option
      // We can call this hack: "The next tick"
      setTimeout(() => {
        inputRef?.current?.blur();
      }, 0);
    },
    [places]
  );

  const handleOptionSelection = (place: google.maps.places.Place) => {
    let street: string | null = "";
    let city: string | null = "";
    let state: string | null = "";
    let postalCode: string | null = "";
    let country: string | null = "";
    const latitude = place.location?.lat().toFixed(5);
    const longitude = place.location?.lng().toFixed(5);

    place.addressComponents?.forEach((component) => {
      const type = component.types[0];
      switch (type) {
        case "street_number":
          street = component.longText;
          break;
        case "route":
          street = street
            ? `${street} ${component.shortText}`
            : component.shortText;
          break;
        case "postal_code":
          postalCode = component.longText;
          break;
        case "locality":
          city = component.longText;
          break;
        case "administrative_area_level_1":
          state = component.shortText;
          break;
        case "country":
          country = component.longText;
          break;
      }
    });

    const fullAddress = compact([
      street,
      city,
      state,
      postalCode,
      country,
    ]).join(", ");
    setDebouncedInputValue(fullAddress);

    onAddressSelected?.({
      Full_Address: fullAddress,
      Street: street,
      City: city,
      Province: state,
      Zip_Code: postalCode,
      Country: country,
    });
  };

  return (
    <CommandPrimitive className="border-none" onKeyDown={handleKeyDown}>
      <div>
        <AutoCompleteCommandInput
          ref={inputRef}
          value={debouncedInputValue}
          onValueChange={isLoading ? undefined : setDebouncedInputValue}
          onBlur={handleBlur}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
      <div className="relative mt-1">
        <div
          className={cn(
            "animate-in fade-in-0 zoom-in-95 absolute top-0 z-10 w-full rounded-xl bg-white outline-none",
            isOpen ? "block" : "hidden"
          )}
        >
          <CommandList className="rounded-lg ring-1 ring-slate-200">
            {isLoading ? (
              <CommandPrimitive.Loading>
                <div className="p-1">
                  <Skeleton className="h-8 w-full" />
                </div>
              </CommandPrimitive.Loading>
            ) : null}
            {suggestions.length > 0 && !isLoading ? (
              <CommandGroup>
                {suggestions.map((suggestion) => {
                  return (
                    <CommandItem
                      key={suggestion.placePrediction?.text.text}
                      value={suggestion.placePrediction?.text.text}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onSelect={() => handleSuggestionClick(suggestion)}
                      className={cn("flex w-full items-center gap-2")}
                    >
                      {suggestion.placePrediction?.text.text}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : null}
            {!isLoading && inputValue?.length ? (
              <CommandPrimitive.Empty className="rounded-sm px-2 py-3 text-center text-sm select-none">
                {emptyMessage}
              </CommandPrimitive.Empty>
            ) : null}
          </CommandList>
        </div>
      </div>
    </CommandPrimitive>
  );
};
